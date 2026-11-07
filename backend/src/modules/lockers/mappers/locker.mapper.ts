import { DateOnly } from '../../../common/utils/date-only';
import { toMoney } from '../../../common/utils/money';
import { LocationMapper } from '../../locations/mappers/location.mapper';
import { UserMapper } from '../../users/mappers/user.mapper';
import { daysRemaining, deriveLockerStatus, deriveSubscriptionState } from '../domain/locker-status';
import { LockerResponseDto } from '../dto/locker.dto';
import { LockerWithOccupancy } from '../repositories/locker.repository';

export class LockerMapper {
  static toResponse(locker: LockerWithOccupancy, today: Date): LockerResponseDto {
    const { status, subscription } = deriveLockerStatus(locker.isOutOfService, locker.subscriptions, today);
    return {
      id: locker.id,
      code: locker.code,
      building: LocationMapper.toBuildingSummary(locker.building),
      floor: locker.floor,
      zone: locker.zone,
      size: locker.size,
      monthlyFee: toMoney(locker.monthlyFee),
      isOutOfService: locker.isOutOfService,
      outOfServiceNote: locker.outOfServiceNote,
      status,
      occupancy: subscription
        ? {
            subscriptionId: subscription.id,
            student: UserMapper.toSummary(subscription.student),
            startDate: DateOnly.format(subscription.startDate),
            endDate: DateOnly.format(subscription.endDate),
            state: deriveSubscriptionState(subscription, today),
            daysRemaining: daysRemaining(subscription.endDate, today),
          }
        : null,
    };
  }
}
