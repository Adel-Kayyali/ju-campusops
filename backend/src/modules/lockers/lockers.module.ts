import { Module } from '@nestjs/common';
import { LocationsModule } from '../locations/locations.module';
import { UsersModule } from '../users/users.module';
import { LockerSubscriptionController } from './controllers/locker-subscription.controller';
import { LockerController } from './controllers/locker.controller';
import { LockerSubscriptionRepository } from './repositories/locker-subscription.repository';
import { LockerRepository } from './repositories/locker.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { LockerSubscriptionService } from './services/locker-subscription.service';
import { LockerService } from './services/locker.service';

@Module({
  imports: [UsersModule, LocationsModule],
  controllers: [LockerController, LockerSubscriptionController],
  providers: [LockerService, LockerSubscriptionService, LockerRepository, LockerSubscriptionRepository, PaymentRepository],
  exports: [LockerService, LockerSubscriptionService],
})
export class LockersModule {}
