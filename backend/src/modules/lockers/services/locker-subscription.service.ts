import { Injectable } from '@nestjs/common';
import { LockerSubscription, PaymentMethod, Prisma, Role, SubscriptionStatus } from '@prisma/client';
import { PageDto } from '../../../common/dto/page.dto';
import {
  AccessDeniedException,
  BusinessRuleViolationException,
  EntityNotFoundException,
  InvalidStateTransitionException,
  ResourceConflictException,
} from '../../../common/exceptions/domain.exceptions';
import { isManagement } from '../../../common/security/role-groups';
import { CampusClock } from '../../../common/time/campus-clock';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { DateOnly } from '../../../common/utils/date-only';
import { toMoney } from '../../../common/utils/money';
import { SequenceName, SequenceService } from '../../../database/sequence.service';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { UserService } from '../../users/services/user.service';
import { quotePrice } from '../domain/locker-pricing';
import { LockerRules } from '../domain/locker-rules';
import { SubscriptionPeriod } from '../domain/subscription-period';
import {
  EndSubscriptionDto,
  ExtendSubscriptionDto,
  PeriodInputDto,
  QuoteResponseDto,
  QuoteSubscriptionDto,
  StartSubscriptionDto,
  SubscriptionQueryDto,
  SubscriptionResponseDto,
} from '../dto/subscription.dto';
import { SubscriptionMapper } from '../mappers/subscription.mapper';
import { LockerSubscriptionRepository, SubscriptionWithDetails } from '../repositories/locker-subscription.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { LockerService } from './locker.service';

/**
 * Locker subscriptions: quote, start (cash payment), extend, end, and queries.
 * Invariant: a locker never has two ACTIVE subscriptions with overlapping dates
 * (checked here and guaranteed by a database EXCLUDE constraint).
 */
@Injectable()
export class LockerSubscriptionService {
  constructor(
    private readonly subscriptionRepository: LockerSubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly lockerService: LockerService,
    private readonly userService: UserService,
    private readonly sequenceService: SequenceService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly clock: CampusClock,
  ) {}

  // ------------------------------------------------------------------ queries

  async getSubscription(id: string): Promise<SubscriptionWithDetails> {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new EntityNotFoundException('LockerSubscription', id);
    }
    return subscription;
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<SubscriptionResponseDto> {
    const subscription = await this.getSubscription(id);
    if (!isManagement(user.role) && subscription.studentId !== user.id) {
      throw new AccessDeniedException('You can only view your own lockers');
    }
    return SubscriptionMapper.toResponse(subscription, this.clock.today());
  }

  async search(query: SubscriptionQueryDto): Promise<PageDto<SubscriptionResponseDto>> {
    const today = this.clock.today();
    const where: Prisma.LockerSubscriptionWhereInput = {
      lockerId: query.lockerId,
      studentId: query.studentId,
      status: query.status,
      student: query.student
        ? {
            OR: [
              { fullName: { contains: query.student, mode: 'insensitive' } },
              { universityId: { contains: query.student, mode: 'insensitive' } },
            ],
          }
        : undefined,
    };
    const [rows, total] = await this.subscriptionRepository.findPage(where, { startDate: query.sortDir === 'asc' ? 'asc' : 'desc' }, query.skip, query.take);
    return PageDto.of(rows.map((row) => SubscriptionMapper.toResponse(row, today)), total, query.page, query.size);
  }

  /** The student's own lockers: live ones first, then history. */
  async findMine(studentId: string): Promise<SubscriptionResponseDto[]> {
    const today = this.clock.today();
    const rows = await this.subscriptionRepository.findAll({ studentId }, { startDate: 'desc' });
    return rows
      .map((row) => SubscriptionMapper.toResponse(row, today))
      .sort((a, b) => Number(b.status === SubscriptionStatus.ACTIVE) - Number(a.status === SubscriptionStatus.ACTIVE));
  }

  // ----------------------------------------------------------------- commands

  /** Price preview for the "start subscription" dialog. Never writes anything. */
  async quote(dto: QuoteSubscriptionDto): Promise<QuoteResponseDto> {
    const locker = await this.lockerService.getLocker(dto.lockerId);
    const period = this.resolvePeriod(dto);
    const price = quotePrice(Number(locker.monthlyFee), period);
    const conflict = await this.subscriptionRepository.findOverlapping(locker.id, period.start, period.end);
    return {
      ...period.toJSON(),
      days: period.days,
      ...price,
      conflict: conflict
        ? { subscriptionId: conflict.id, startDate: DateOnly.format(conflict.startDate), endDate: DateOnly.format(conflict.endDate) }
        : null,
    };
  }

  @Transactional()
  async start(dto: StartSubscriptionDto, actor: AuthenticatedUser): Promise<SubscriptionResponseDto> {
    const today = this.clock.today();
    const locker = await this.lockerService.getLocker(dto.lockerId);
    if (locker.isOutOfService) {
      throw new BusinessRuleViolationException(`Locker ${locker.code} is out of service`, 'LOCKER_OUT_OF_SERVICE');
    }
    const student = await this.userService.getActiveUserWithRole(dto.studentId, [Role.STUDENT], 'student');
    const period = this.resolvePeriod(dto);
    this.assertStartDateAllowed(period.start, today);
    await this.assertNoOverlap(locker.id, period);

    const price = quotePrice(Number(locker.monthlyFee), period);
    const subscription = await this.subscriptionRepository.create({
      lockerId: locker.id,
      studentId: student.id,
      startDate: period.start,
      endDate: period.end,
      notes: dto.notes ?? null,
      createdById: actor.id,
    });
    const receiptNumber = await this.recordPayment(subscription, period, dto.amountOverride ?? price.amount, dto.paymentMethod, dto.receiptNumber, actor.id);

    await this.notificationService.notifyUser(student.id, {
      title: `Locker ${locker.code} is yours`,
      message: `Your subscription runs from ${DateOnly.format(period.start)} to ${DateOnly.format(period.end)}. Receipt ${receiptNumber}.`,
      link: '/my-lockers',
    });
    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.SUBSCRIPTION_STARTED,
      entityType: 'LockerSubscription',
      entityId: subscription.id,
      details: { locker: locker.code, student: student.fullName, ...period.toJSON(), amount: dto.amountOverride ?? price.amount, receiptNumber },
    });
    return SubscriptionMapper.toResponse(await this.getSubscription(subscription.id), today);
  }

  /** Adds time after the current end date; the extra period is paid separately. */
  @Transactional()
  async extend(id: string, dto: ExtendSubscriptionDto, actor: AuthenticatedUser): Promise<SubscriptionResponseDto> {
    const today = this.clock.today();
    const subscription = await this.getSubscription(id);
    this.assertActive(subscription, 'extended');
    if (subscription.locker.isOutOfService) {
      throw new BusinessRuleViolationException(`Locker ${subscription.locker.code} is out of service`, 'LOCKER_OUT_OF_SERVICE');
    }

    const extensionStart = DateOnly.addDays(subscription.endDate, 1);
    const extension = this.resolvePeriod({ startDate: DateOnly.format(extensionStart), durationMonths: dto.durationMonths, endDate: dto.newEndDate });
    await this.assertNoOverlap(subscription.lockerId, extension, subscription.id);

    const price = quotePrice(Number(subscription.locker.monthlyFee), extension);
    await this.subscriptionRepository.update(id, { endDate: extension.end });
    const receiptNumber = await this.recordPayment(subscription, extension, dto.amountOverride ?? price.amount, PaymentMethod.CASH, dto.receiptNumber, actor.id);

    await this.notificationService.notifyUser(subscription.studentId, {
      title: `Locker ${subscription.locker.code} extended`,
      message: `Your subscription now ends on ${DateOnly.format(extension.end)}. Receipt ${receiptNumber}.`,
      link: '/my-lockers',
    });
    await this.auditService.record({
      actorId: actor.id,
      action: AuditAction.SUBSCRIPTION_EXTENDED,
      entityType: 'LockerSubscription',
      entityId: id,
      details: { locker: subscription.locker.code, previousEnd: DateOnly.format(subscription.endDate), newEnd: DateOnly.format(extension.end), receiptNumber },
    });
    return SubscriptionMapper.toResponse(await this.getSubscription(id), today);
  }

  /**
   * Ends a subscription and releases the locker immediately.
   * A subscription that has not started yet is CANCELLED instead of ENDED.
   */
  @Transactional()
  async end(id: string, dto: EndSubscriptionDto, actor: AuthenticatedUser): Promise<SubscriptionResponseDto> {
    const today = this.clock.today();
    const subscription = await this.getSubscription(id);
    this.assertActive(subscription, 'ended');

    const notStartedYet = subscription.startDate > today;
    const status = notStartedYet ? SubscriptionStatus.CANCELLED : SubscriptionStatus.ENDED;
    await this.subscriptionRepository.update(id, { status, endedAt: new Date(), endedById: actor.id, endReason: dto.reason });

    await this.notificationService.notifyUser(subscription.studentId, {
      title: `Locker ${subscription.locker.code} subscription ${notStartedYet ? 'cancelled' : 'ended'}`,
      message: `Reason: ${dto.reason}`,
      link: '/my-lockers',
    });
    await this.auditService.record({
      actorId: actor.id,
      action: notStartedYet ? AuditAction.SUBSCRIPTION_CANCELLED : AuditAction.SUBSCRIPTION_ENDED,
      entityType: 'LockerSubscription',
      entityId: id,
      details: { locker: subscription.locker.code, student: subscription.student.fullName, reason: dto.reason },
    });
    return SubscriptionMapper.toResponse(await this.getSubscription(id), today);
  }

  /** Daily job: reminds students whose locker expires in `daysAhead` days. Returns how many were notified. */
  @Transactional()
  async sendExpiryReminders(daysAhead = 3): Promise<number> {
    const target = DateOnly.addDays(this.clock.today(), daysAhead);
    const ending = await this.subscriptionRepository.findEndingOn(target);
    for (const subscription of ending) {
      await this.notificationService.notifyUser(subscription.studentId, {
        title: `Locker ${subscription.locker.code} expires soon`,
        message: `Your locker subscription ends on ${DateOnly.format(subscription.endDate)}. Visit the facilities office to renew it.`,
        link: '/my-lockers',
      });
    }
    return ending.length;
  }

  // ------------------------------------------------------------------ helpers

  private resolvePeriod(input: PeriodInputDto): SubscriptionPeriod {
    const start = DateOnly.parse(input.startDate);
    const hasMonths = input.durationMonths !== undefined && input.durationMonths !== null;
    const hasEnd = Boolean(input.endDate);
    if (hasMonths === hasEnd) {
      throw new BusinessRuleViolationException('Provide either a duration in months or an end date (not both)', 'PERIOD_REQUIRED');
    }
    return hasMonths ? SubscriptionPeriod.ofMonths(start, input.durationMonths!) : SubscriptionPeriod.ofRange(start, DateOnly.parse(input.endDate!));
  }

  private assertStartDateAllowed(start: Date, today: Date): void {
    const offset = DateOnly.daysBetween(today, start);
    if (offset < -LockerRules.MAX_BACKDATE_DAYS) {
      throw new BusinessRuleViolationException(`The start date cannot be more than ${LockerRules.MAX_BACKDATE_DAYS} days in the past`, 'START_DATE_TOO_OLD');
    }
    if (offset > LockerRules.MAX_ADVANCE_DAYS) {
      throw new BusinessRuleViolationException(`The start date cannot be more than ${LockerRules.MAX_ADVANCE_DAYS} days ahead`, 'START_DATE_TOO_FAR');
    }
  }

  private async assertNoOverlap(lockerId: string, period: SubscriptionPeriod, excludeId?: string): Promise<void> {
    const conflict = await this.subscriptionRepository.findOverlapping(lockerId, period.start, period.end, excludeId);
    if (conflict) {
      throw new ResourceConflictException(
        `The locker is already taken from ${DateOnly.format(conflict.startDate)} to ${DateOnly.format(conflict.endDate)}`,
        'LOCKER_ALREADY_SUBSCRIBED',
        { subscriptionId: conflict.id, startDate: DateOnly.format(conflict.startDate), endDate: DateOnly.format(conflict.endDate) },
      );
    }
  }

  private assertActive(subscription: LockerSubscription, action: string): void {
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new InvalidStateTransitionException('LockerSubscription', subscription.status, action.toUpperCase());
    }
  }

  private async recordPayment(
    subscription: LockerSubscription,
    period: SubscriptionPeriod,
    amount: number,
    method: PaymentMethod | undefined,
    requestedReceipt: string | undefined,
    receivedById: string,
  ): Promise<string> {
    let receiptNumber = requestedReceipt?.toUpperCase();
    if (receiptNumber && (await this.paymentRepository.existsByReceiptNumber(receiptNumber))) {
      throw new ResourceConflictException(`Receipt ${receiptNumber} was already used`, 'RECEIPT_NUMBER_TAKEN');
    }
    receiptNumber ??= await this.sequenceService.next(SequenceName.RECEIPT);
    await this.paymentRepository.create({
      subscriptionId: subscription.id,
      amount: toMoney(amount),
      method: method ?? PaymentMethod.CASH,
      receiptNumber,
      periodStart: period.start,
      periodEnd: period.end,
      receivedById,
    });
    return receiptNumber;
  }
}
