import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageDto } from '../../../common/dto/page.dto';
import { EntityNotFoundException, ResourceConflictException } from '../../../common/exceptions/domain.exceptions';
import { CampusClock } from '../../../common/time/campus-clock';
import { DateOnly } from '../../../common/utils/date-only';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { LocationService } from '../../locations/services/location.service';
import { LockerRules } from '../domain/locker-rules';
import { deriveLockerStatus, LockerStatus } from '../domain/locker-status';
import {
  CreateLockerDto,
  LockerDetailResponseDto,
  LockerQueryDto,
  LockerResponseDto,
  LockerSummaryDto,
  SetLockerServiceStatusDto,
  UpdateLockerDto,
} from '../dto/locker.dto';
import { LockerMapper } from '../mappers/locker.mapper';
import { SubscriptionMapper } from '../mappers/subscription.mapper';
import { LockerSubscriptionRepository } from '../repositories/locker-subscription.repository';
import { LockerRepository, LockerWithOccupancy } from '../repositories/locker.repository';
import { LockerSpecifications } from '../repositories/locker.specifications';
import { PaymentRepository } from '../repositories/payment.repository';

const SORTS: Record<string, Prisma.LockerOrderByWithRelationInput[]> = {
  code: [{ code: 'asc' }],
  building: [{ building: { code: 'asc' } }, { code: 'asc' }],
  floor: [{ floor: 'asc' }, { code: 'asc' }],
  size: [{ size: 'asc' }, { code: 'asc' }],
  monthlyFee: [{ monthlyFee: 'asc' }, { code: 'asc' }],
};

/** Locker inventory: listing with filters, details, statistics and maintenance state. */
@Injectable()
export class LockerService {
  constructor(
    private readonly lockerRepository: LockerRepository,
    private readonly subscriptionRepository: LockerSubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly locationService: LocationService,
    private readonly auditService: AuditService,
    private readonly clock: CampusClock,
  ) {}

  async getLocker(id: string): Promise<LockerWithOccupancy> {
    const locker = await this.lockerRepository.findById(id);
    if (!locker) {
      throw new EntityNotFoundException('Locker', id);
    }
    return locker;
  }

  async search(query: LockerQueryDto): Promise<PageDto<LockerResponseDto>> {
    const today = this.clock.today();
    const where = this.buildFilter(query, today);
    const orderBy = (SORTS[query.sortBy ?? 'code'] ?? SORTS.code).map((sort) => flipDirection(sort, query.sortDir));
    const [lockers, total] = await this.lockerRepository.findPage(where, orderBy, query.skip, query.take);
    return PageDto.of(lockers.map((locker) => LockerMapper.toResponse(locker, today)), total, query.page, query.size);
  }

  async findOne(id: string): Promise<LockerDetailResponseDto> {
    const today = this.clock.today();
    const locker = await this.getLocker(id);
    const history = await this.subscriptionRepository.findAll({ lockerId: id }, { startDate: 'desc' });
    return {
      locker: LockerMapper.toResponse(locker, today),
      history: history.map((subscription) => SubscriptionMapper.toResponse(subscription, today)),
    };
  }

  async summary(): Promise<LockerSummaryDto> {
    const today = this.clock.today();
    const lockers = await this.lockerRepository.findAllWithOccupancy();
    const counts = new Map<LockerStatus, number>(Object.values(LockerStatus).map((status) => [status, 0]));
    for (const locker of lockers) {
      const { status } = deriveLockerStatus(locker.isOutOfService, locker.subscriptions, today);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    const inService = lockers.length - (counts.get(LockerStatus.OUT_OF_SERVICE) ?? 0);
    const taken = (counts.get(LockerStatus.OCCUPIED) ?? 0) + (counts.get(LockerStatus.EXPIRING_SOON) ?? 0) + (counts.get(LockerStatus.EXPIRED) ?? 0);
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

    return {
      totalLockers: lockers.length,
      byStatus: [...counts.entries()].map(([status, count]) => ({ status, count })),
      occupancyRate: inService === 0 ? 0 : Math.round((taken / inService) * 1000) / 10,
      expiringThisWeek: counts.get(LockerStatus.EXPIRING_SOON) ?? 0,
      activeSubscriptions: await this.subscriptionRepository.countActiveCoveringToday(today),
      cashCollectedThisMonth: await this.paymentRepository.sumReceivedBetween(monthStart, DateOnly.addMonths(monthStart, 1)),
    };
  }

  @Transactional()
  async create(dto: CreateLockerDto, actorId: string): Promise<LockerResponseDto> {
    const code = dto.code.toUpperCase();
    if (await this.lockerRepository.findByCode(code)) {
      throw new ResourceConflictException(`Locker ${code} already exists`, 'LOCKER_CODE_TAKEN');
    }
    await this.locationService.assertLocation(dto.buildingId);
    const locker = await this.lockerRepository.create({ ...dto, code });
    await this.auditService.record({ actorId, action: AuditAction.LOCKER_CREATED, entityType: 'Locker', entityId: locker.id, details: { code } });
    return LockerMapper.toResponse(await this.getLocker(locker.id), this.clock.today());
  }

  @Transactional()
  async update(id: string, dto: UpdateLockerDto, actorId: string): Promise<LockerResponseDto> {
    await this.getLocker(id);
    await this.lockerRepository.update(id, dto);
    await this.auditService.record({ actorId, action: AuditAction.LOCKER_UPDATED, entityType: 'Locker', entityId: id, details: { ...dto } });
    return LockerMapper.toResponse(await this.getLocker(id), this.clock.today());
  }

  /** Marks a locker as broken (cannot be rented) or repaired. Existing subscriptions are kept. */
  @Transactional()
  async setServiceStatus(id: string, dto: SetLockerServiceStatusDto, actorId: string): Promise<LockerResponseDto> {
    await this.getLocker(id);
    await this.lockerRepository.update(id, {
      isOutOfService: dto.isOutOfService,
      outOfServiceNote: dto.isOutOfService ? (dto.note ?? null) : null,
    });
    await this.auditService.record({
      actorId,
      action: dto.isOutOfService ? AuditAction.LOCKER_OUT_OF_SERVICE : AuditAction.LOCKER_BACK_IN_SERVICE,
      entityType: 'Locker',
      entityId: id,
      details: { note: dto.note },
    });
    return LockerMapper.toResponse(await this.getLocker(id), this.clock.today());
  }

  private buildFilter(query: LockerQueryDto, today: Date): Prisma.LockerWhereInput {
    const conditions: Prisma.LockerWhereInput[] = [];
    if (query.code) conditions.push({ code: { contains: query.code, mode: 'insensitive' } });
    if (query.buildingId) conditions.push({ buildingId: query.buildingId });
    if (query.floor !== undefined) conditions.push({ floor: query.floor });
    if (query.zone) conditions.push({ zone: { contains: query.zone, mode: 'insensitive' } });
    if (query.lockerSize) conditions.push({ size: query.lockerSize });
    if (query.status) conditions.push(LockerSpecifications.hasStatus(query.status, today));
    if (query.student) conditions.push(LockerSpecifications.heldByStudent(query.student));
    if (query.endsFrom || query.endsTo) {
      conditions.push(
        LockerSpecifications.subscriptionEndsBetween(
          query.endsFrom ? DateOnly.parse(query.endsFrom) : undefined,
          query.endsTo ? DateOnly.parse(query.endsTo) : undefined,
        ),
      );
    }
    return conditions.length > 0 ? { AND: conditions } : {};
  }
}

/** Applies the requested direction to a (possibly nested) orderBy clause; the code tie-breaker stays ascending. */
function flipDirection(sort: Prisma.LockerOrderByWithRelationInput, direction: 'asc' | 'desc'): Prisma.LockerOrderByWithRelationInput {
  if ('code' in sort && Object.keys(sort).length === 1) return { code: direction };
  return JSON.parse(JSON.stringify(sort).replace(/"asc"/g, `"${direction}"`)) as Prisma.LockerOrderByWithRelationInput;
}
