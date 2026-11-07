import { WorkOrderStatus } from '@prisma/client';
import { LocationMapper } from '../../locations/mappers/location.mapper';
import { MaterialResponseDto } from '../../inventory/dto/inventory.dto';
import { AttachmentService } from '../../storage/services/attachment.service';
import { UserMapper } from '../../users/mappers/user.mapper';
import { isSatisfied } from '../domain/task-rules';
import { WorkOrderAction } from '../domain/work-order-actions';
import { WorkOrderStatusMachine } from '../domain/work-order-status.machine';
import { WorkOrderDetailDto, WorkOrderResponseDto } from '../dto/work-order.dto';
import { WorkOrderDetail, WorkOrderListItem } from '../repositories/work-order.repository';

export class WorkOrderMapper {
  static toResponse(workOrder: WorkOrderListItem | WorkOrderDetail, now: Date): WorkOrderResponseDto {
    const building = workOrder.request?.building ?? ('building' in (workOrder.asset ?? {}) ? (workOrder.asset as { building: { id: string; code: string; name: string } }).building : null);
    return {
      id: workOrder.id,
      code: workOrder.code,
      type: workOrder.type,
      title: workOrder.title,
      priority: workOrder.priority,
      status: workOrder.status,
      technician: workOrder.technician ? { id: workOrder.technician.id, fullName: workOrder.technician.fullName } : null,
      asset: workOrder.asset ? { id: workOrder.asset.id, code: workOrder.asset.code, name: workOrder.asset.name } : null,
      request: workOrder.request ? { id: workOrder.request.id, code: workOrder.request.code, title: workOrder.request.title, status: workOrder.request.status } : null,
      building: building ? LocationMapper.toBuildingSummary(building) : null,
      room: LocationMapper.toRoomSummary(workOrder.request?.room),
      dueAt: workOrder.dueAt.toISOString(),
      isOverdue: WorkOrderStatusMachine.isActive(workOrder.status) && workOrder.dueAt < now,
      isBlocked: workOrder.status !== WorkOrderStatus.CANCELLED && workOrder._count.materials > 0,
      createdAt: workOrder.createdAt.toISOString(),
      completedAt: workOrder.completedAt?.toISOString() ?? null,
    };
  }

  static toDetail(workOrder: WorkOrderDetail, now: Date, materials: MaterialResponseDto[], actions: WorkOrderAction[]): WorkOrderDetailDto {
    const statusBySequence = new Map(workOrder.tasks.map((task) => [task.sequence, task.status]));
    return {
      ...WorkOrderMapper.toResponse(workOrder, now),
      description: workOrder.description,
      repairNotes: workOrder.repairNotes,
      requester: workOrder.request ? UserMapper.toSummary(workOrder.request.requester) : null,
      createdBy: workOrder.createdBy?.fullName ?? null,
      schedule: workOrder.schedule,
      startedAt: workOrder.startedAt?.toISOString() ?? null,
      verifiedAt: workOrder.verifiedAt?.toISOString() ?? null,
      tasks: workOrder.tasks.map((task) => ({
        id: task.id,
        sequence: task.sequence,
        type: task.type,
        title: task.title,
        status: task.status,
        notes: task.notes,
        dependsOn: task.dependsOn.map((d) => d.sequence),
        completedAt: task.completedAt?.toISOString() ?? null,
        completedBy: task.completedBy?.fullName ?? null,
        isUnlocked: task.dependsOn.every((d) => isSatisfied(statusBySequence.get(d.sequence)!)),
      })),
      materials,
      attachments: workOrder.attachments.map(AttachmentService.toDto),
      availableActions: actions,
    };
  }
}
