import { Injectable } from '@nestjs/common';
import { Prisma, ProcurementRequest } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

export const procurementInclude = {
  item: { select: { id: true, sku: true, name: true, unit: true } },
  workOrder: { select: { id: true, code: true } },
  requestedBy: { select: { fullName: true } },
  decidedBy: { select: { fullName: true } },
} satisfies Prisma.ProcurementRequestInclude;

export type ProcurementWithRelations = Prisma.ProcurementRequestGetPayload<{ include: typeof procurementInclude }>;

@Injectable()
export class ProcurementRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<ProcurementWithRelations | null> {
    return this.db.procurementRequest.findUnique({ where: { id }, include: procurementInclude });
  }

  async findPage(where: Prisma.ProcurementRequestWhereInput, skip: number, take: number): Promise<[ProcurementWithRelations[], number]> {
    return Promise.all([
      this.db.procurementRequest.findMany({ where, include: procurementInclude, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.procurementRequest.count({ where }),
    ]);
  }

  create(data: Prisma.ProcurementRequestUncheckedCreateInput): Promise<ProcurementRequest> {
    return this.db.procurementRequest.create({ data });
  }

  update(id: string, data: Prisma.ProcurementRequestUncheckedUpdateInput): Promise<ProcurementRequest> {
    return this.db.procurementRequest.update({ where: { id }, data });
  }
}
