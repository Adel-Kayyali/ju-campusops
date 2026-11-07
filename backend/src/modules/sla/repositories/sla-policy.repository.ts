import { Injectable } from '@nestjs/common';
import { Priority, SlaPolicy } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

@Injectable()
export class SlaPolicyRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findAll(): Promise<SlaPolicy[]> {
    return this.db.slaPolicy.findMany({ orderBy: { priority: 'asc' } });
  }

  findByPriority(priority: Priority): Promise<SlaPolicy | null> {
    return this.db.slaPolicy.findUnique({ where: { priority } });
  }

  upsert(priority: Priority, data: { responseHours: number; resolutionHours: number; description?: string | null }): Promise<SlaPolicy> {
    return this.db.slaPolicy.upsert({ where: { priority }, create: { priority, ...data }, update: data });
  }
}
