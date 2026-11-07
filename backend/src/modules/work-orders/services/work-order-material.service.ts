import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { Transactional } from '../../../database/transactional.decorator';
import { MaterialResponseDto } from '../../inventory/dto/inventory.dto';
import { MaterialAllocationService } from '../../inventory/services/material-allocation.service';
import { WorkOrderService } from './work-order.service';

/** Spare parts of a work order (validates the work order, delegates stock logic to inventory). */
@Injectable()
export class WorkOrderMaterialService {
  constructor(
    private readonly workOrderService: WorkOrderService,
    private readonly allocationService: MaterialAllocationService,
  ) {}

  @Transactional()
  async add(workOrderId: string, itemId: string, quantity: number, actor: AuthenticatedUser): Promise<MaterialResponseDto[]> {
    const workOrder = await this.workOrderService.getWorkOrder(workOrderId);
    this.workOrderService.assertCanAccess(workOrder, actor);
    this.workOrderService.assertActive(workOrder);
    await this.allocationService.require(workOrder, itemId, quantity, actor.id);
    return this.allocationService.listForWorkOrder(workOrderId);
  }

  @Transactional()
  async consume(workOrderId: string, materialId: string, actor: AuthenticatedUser): Promise<MaterialResponseDto[]> {
    const workOrder = await this.workOrderService.getWorkOrder(workOrderId);
    this.workOrderService.assertCanAccess(workOrder, actor);
    this.workOrderService.assertActive(workOrder);
    await this.allocationService.consume(await this.allocationService.getMaterial(materialId, workOrderId), actor.id);
    return this.allocationService.listForWorkOrder(workOrderId);
  }

  @Transactional()
  async release(workOrderId: string, materialId: string, actor: AuthenticatedUser): Promise<MaterialResponseDto[]> {
    const workOrder = await this.workOrderService.getWorkOrder(workOrderId);
    this.workOrderService.assertCanAccess(workOrder, actor);
    await this.allocationService.release(await this.allocationService.getMaterial(materialId, workOrderId), actor.id);
    return this.allocationService.listForWorkOrder(workOrderId);
  }
}
