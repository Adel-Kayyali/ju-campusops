import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';
import { AuditEntry } from '../domain/audit-action';

const withActor = { actor: { select: { id: true, fullName: true, role: true } } } satisfies Prisma.AuditLogInclude;
export type AuditLogWithActor = Prisma.AuditLogGetPayload<{ include: typeof withActor }>;

@Injectable()
export class AuditLogRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  async create(entry: AuditEntry): Promise<void> {
    await this.db.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        details: (entry.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findPage(where: Prisma.AuditLogWhereInput, skip: number, take: number): Promise<[AuditLogWithActor[], number]> {
    return Promise.all([
      this.db.auditLog.findMany({ where, include: withActor, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.auditLog.count({ where }),
    ]);
  }
}
