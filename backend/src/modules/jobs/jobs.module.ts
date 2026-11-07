import { Module } from '@nestjs/common';
import { LockersModule } from '../lockers/lockers.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';
import { CronSecretGuard } from './cron-secret.guard';
import { DailyJobsService } from './daily-jobs.service';
import { JobsController } from './jobs.controller';

@Module({
  imports: [MaintenanceModule, ServiceRequestsModule, LockersModule],
  controllers: [JobsController],
  providers: [DailyJobsService, CronSecretGuard],
})
export class JobsModule {}
