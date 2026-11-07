import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { TechniciansModule } from '../technicians/technicians.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { ScheduleController } from './controllers/schedule.controller';
import { ScheduleRepository } from './repositories/schedule.repository';
import { PreventiveMaintenanceService } from './services/preventive-maintenance.service';

@Module({
  imports: [AssetsModule, TechniciansModule, WorkOrdersModule],
  controllers: [ScheduleController],
  providers: [PreventiveMaintenanceService, ScheduleRepository],
  exports: [PreventiveMaintenanceService],
})
export class MaintenanceModule {}
