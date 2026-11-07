import { Module } from '@nestjs/common';
import { InventoryController } from './controllers/inventory.controller';
import { ProcurementController } from './controllers/procurement.controller';
import { InventoryRepository } from './repositories/inventory.repository';
import { MaterialRepository } from './repositories/material.repository';
import { ProcurementRepository } from './repositories/procurement.repository';
import { InventoryService } from './services/inventory.service';
import { MaterialAllocationService } from './services/material-allocation.service';
import { ProcurementService } from './services/procurement.service';

@Module({
  controllers: [InventoryController, ProcurementController],
  providers: [InventoryService, MaterialAllocationService, ProcurementService, InventoryRepository, MaterialRepository, ProcurementRepository],
  exports: [InventoryService, MaterialAllocationService],
})
export class InventoryModule {}
