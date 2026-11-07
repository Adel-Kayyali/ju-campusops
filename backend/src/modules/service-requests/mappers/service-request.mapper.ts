import { RequestStatus } from '@prisma/client';
import { LocationMapper } from '../../locations/mappers/location.mapper';
import { evaluateSla } from '../../sla/domain/sla-evaluator';
import { AttachmentService } from '../../storage/services/attachment.service';
import { UserMapper } from '../../users/mappers/user.mapper';
import { RequestAction } from '../domain/request-actions';
import { ServiceRequestDetailDto, ServiceRequestResponseDto } from '../dto/service-request.dto';
import { RequestDetail, RequestListItem } from '../repositories/service-request.repository';

export class ServiceRequestMapper {
  static toResponse(request: RequestListItem, now: Date): ServiceRequestResponseDto {
    const finishedAt = request.status === RequestStatus.REJECTED ? (request.closedAt ?? request.updatedAt) : request.resolvedAt;
    return {
      id: request.id,
      code: request.code,
      title: request.title,
      category: request.category,
      severity: request.severity,
      urgency: request.urgency,
      priority: request.priority,
      isSafetyRelated: request.isSafetyRelated,
      status: request.status,
      building: LocationMapper.toBuildingSummary(request.building),
      room: LocationMapper.toRoomSummary(request.room),
      asset: request.asset ? { id: request.asset.id, code: request.asset.code, name: request.asset.name } : null,
      requester: UserMapper.toSummary(request.requester),
      createdAt: request.createdAt.toISOString(),
      responseDueAt: request.responseDueAt.toISOString(),
      resolutionDueAt: request.resolutionDueAt.toISOString(),
      resolvedAt: request.resolvedAt?.toISOString() ?? null,
      slaState: evaluateSla({ createdAt: request.createdAt, resolutionDueAt: request.resolutionDueAt, resolvedAt: finishedAt, now }),
      isEscalated: request.escalatedAt !== null,
      attachmentCount: request._count.attachments,
    };
  }

  static toDetail(request: RequestDetail, now: Date, availableActions: RequestAction[]): ServiceRequestDetailDto {
    return {
      ...ServiceRequestMapper.toResponse(request, now),
      description: request.description,
      locationDetails: request.locationDetails,
      preferredContact: request.preferredContact,
      contactDetail: request.contactDetail,
      rejectionReason: request.rejectionReason,
      acknowledgedAt: request.acknowledgedAt?.toISOString() ?? null,
      closedAt: request.closedAt?.toISOString() ?? null,
      attachments: request.attachments.map(AttachmentService.toDto),
      history: request.statusHistory.map((entry) => ({
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        note: entry.note,
        changedBy: entry.changedBy.fullName,
        changedByRole: entry.changedBy.role,
        changedAt: entry.changedAt.toISOString(),
      })),
      workOrders: request.workOrders.map((wo) => ({
        id: wo.id,
        code: wo.code,
        status: wo.status,
        technician: wo.technician ? { id: wo.technician.id, fullName: wo.technician.fullName } : null,
        dueAt: wo.dueAt.toISOString(),
      })),
      feedback: request.feedback
        ? { rating: request.feedback.rating, comment: request.feedback.comment, createdAt: request.feedback.createdAt.toISOString() }
        : null,
      availableActions,
    };
  }
}
