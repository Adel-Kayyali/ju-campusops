import { Injectable } from '@nestjs/common';
import { Priority } from '@prisma/client';
import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exceptions';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { DEFAULT_SLA_POLICIES, SlaTargets } from '../domain/default-sla-policies';
import { SlaPolicyResponseDto, UpdateSlaPolicyDto } from '../dto/sla-policy.dto';
import { SlaPolicyRepository } from '../repositories/sla-policy.repository';

export interface SlaDueDates {
  responseDueAt: Date;
  resolutionDueAt: Date;
}

const HOUR_MS = 3_600_000;

/** Service-level targets: computes due dates and lets the admin tune them. */
@Injectable()
export class SlaService {
  constructor(
    private readonly repository: SlaPolicyRepository,
    private readonly auditService: AuditService,
  ) {}

  async getTargets(priority: Priority): Promise<SlaTargets> {
    const policy = await this.repository.findByPriority(priority);
    return policy
      ? { responseHours: policy.responseHours, resolutionHours: policy.resolutionHours, description: policy.description ?? '' }
      : DEFAULT_SLA_POLICIES[priority];
  }

  async calculateDueDates(priority: Priority, from: Date): Promise<SlaDueDates> {
    const targets = await this.getTargets(priority);
    return {
      responseDueAt: new Date(from.getTime() + targets.responseHours * HOUR_MS),
      resolutionDueAt: new Date(from.getTime() + targets.resolutionHours * HOUR_MS),
    };
  }

  async findAll(): Promise<SlaPolicyResponseDto[]> {
    const stored = new Map((await this.repository.findAll()).map((policy) => [policy.priority, policy]));
    return Object.values(Priority).map((priority) => {
      const policy = stored.get(priority);
      const fallback = DEFAULT_SLA_POLICIES[priority];
      return {
        priority,
        responseHours: policy?.responseHours ?? fallback.responseHours,
        resolutionHours: policy?.resolutionHours ?? fallback.resolutionHours,
        description: policy?.description ?? fallback.description,
      };
    });
  }

  @Transactional()
  async update(priority: Priority, dto: UpdateSlaPolicyDto, actorId: string): Promise<SlaPolicyResponseDto> {
    if (dto.resolutionHours < dto.responseHours) {
      throw new BusinessRuleViolationException('Resolution time cannot be shorter than response time', 'INVALID_SLA_TARGETS');
    }
    const policy = await this.repository.upsert(priority, dto);
    await this.auditService.record({ actorId, action: AuditAction.SLA_POLICY_UPDATED, entityType: 'SlaPolicy', entityId: priority, details: { ...dto } });
    return { priority: policy.priority, responseHours: policy.responseHours, resolutionHours: policy.resolutionHours, description: policy.description };
  }
}
