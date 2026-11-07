import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageDto } from '../../../common/dto/page.dto';
import { DateOnly } from '../../../common/utils/date-only';
import { AuditEntry } from '../domain/audit-action';
import { AuditLogQueryDto, AuditLogResponseDto } from '../dto/audit-log.dto';
import { AuditLogRepository } from '../repositories/audit-log.repository';

/** Writes and reads the timestamped audit trail of every important change. */
@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditLogRepository) {}

  /** Records an entry inside the caller's transaction (rolled back together with the change). */
  record(entry: AuditEntry): Promise<void> {
    return this.repository.create(entry);
  }

  async search(query: AuditLogQueryDto): Promise<PageDto<AuditLogResponseDto>> {
    const where: Prisma.AuditLogWhereInput = {
      entityType: query.entityType || undefined,
      entityId: query.entityId || undefined,
      actorId: query.actorId || undefined,
      action: query.action ? { contains: query.action, mode: 'insensitive' } : undefined,
      createdAt: {
        gte: query.from ? DateOnly.parse(query.from) : undefined,
        lt: query.to ? DateOnly.addDays(DateOnly.parse(query.to), 1) : undefined,
      },
    };
    const [rows, total] = await this.repository.findPage(where, query.skip, query.take);
    return PageDto.of(
      rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        details: row.details as Record<string, unknown> | null,
        actor: row.actor ? { id: row.actor.id, fullName: row.actor.fullName, role: row.actor.role } : null,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      query.page,
      query.size,
    );
  }
}
