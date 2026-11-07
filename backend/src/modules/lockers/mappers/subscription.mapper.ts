import { DateOnly } from '../../../common/utils/date-only';
import { toMoney } from '../../../common/utils/money';
import { LocationMapper } from '../../locations/mappers/location.mapper';
import { UserMapper } from '../../users/mappers/user.mapper';
import { daysRemaining, deriveSubscriptionState, SubscriptionState } from '../domain/locker-status';
import { SubscriptionResponseDto } from '../dto/subscription.dto';
import { SubscriptionWithDetails } from '../repositories/locker-subscription.repository';

export class SubscriptionMapper {
  static toResponse(subscription: SubscriptionWithDetails, today: Date): SubscriptionResponseDto {
    const state = deriveSubscriptionState(subscription, today);
    const isLive = state !== SubscriptionState.ENDED && state !== SubscriptionState.CANCELLED;
    return {
      id: subscription.id,
      locker: {
        id: subscription.locker.id,
        code: subscription.locker.code,
        building: LocationMapper.toBuildingSummary(subscription.locker.building),
        floor: subscription.locker.floor,
        zone: subscription.locker.zone,
        size: subscription.locker.size,
      },
      student: UserMapper.toSummary(subscription.student),
      startDate: DateOnly.format(subscription.startDate),
      endDate: DateOnly.format(subscription.endDate),
      status: subscription.status,
      state,
      daysRemaining: isLive ? daysRemaining(subscription.endDate, today) : 0,
      totalPaid: toMoney(subscription.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)),
      payments: subscription.payments.map((payment) => ({
        id: payment.id,
        amount: toMoney(payment.amount),
        method: payment.method,
        receiptNumber: payment.receiptNumber,
        periodStart: DateOnly.format(payment.periodStart),
        periodEnd: DateOnly.format(payment.periodEnd),
        receivedBy: payment.receivedBy.fullName,
        receivedAt: payment.receivedAt.toISOString(),
      })),
      notes: subscription.notes,
      createdBy: subscription.createdBy.fullName,
      endedAt: subscription.endedAt?.toISOString() ?? null,
      endedBy: subscription.endedBy?.fullName ?? null,
      endReason: subscription.endReason,
      createdAt: subscription.createdAt.toISOString(),
    };
  }
}
