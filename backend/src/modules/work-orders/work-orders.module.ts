import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ServiceRequestsModule } from '../service-requests/service-requests.module';
import { SlaModule } from '../sla/sla.module';
import { TechniciansModule } from '../technicians/technicians.module';
import { WorkOrderController } from './controllers/work-order.controller';
import { ServiceRequestListener } from './listeners/service-request.listener';
import { WorkOrderRepository } from './repositories/work-order.repository';
import { WorkOrderMaterialService } from './services/work-order-material.service';
import { WorkOrderTaskService } from './services/work-order-task.service';
import { WorkOrderService } from './services/work-order.service';

@Module({
  imports: [ServiceRequestsModule, TechniciansModule, AssetsModule, InventoryModule, SlaModule],
  controllers: [WorkOrderController],
  providers: [WorkOrderService, WorkOrderTaskService, WorkOrderMaterialService, WorkOrderRepository, ServiceRequestListener],
  exports: [WorkOrderService],
})
export class WorkOrdersModule {}
