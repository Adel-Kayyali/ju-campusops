import { Injectable } from '@nestjs/common';
import { MaterialRequirement, MaterialStatus, Prisma } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

export const materialInclude = {
  item: { select: { id: true, sku: true, name: true, unit: true } },
  workOrder: { select: { id: true, code: true, title: true, technicianId: true, status: true } },
} satisfies Prisma.MaterialRequirementInclude;

export type MaterialWithRelations = Prisma.MaterialRequirementGetPayload<{ include: typeof materialInclude }>;

@Injectable()
export class MaterialRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<MaterialWithRelations | null> {
    return this.db.materialRequirement.findUnique({ where: { id }, include: materialInclude });
  }

  findByWorkOrder(workOrderId: string): Promise<MaterialWithRelations[]> {
    return this.db.materialRequirement.findMany({ where: { workOrderId }, include: materialInclude, orderBy: { createdAt: 'asc' } });
  }

  findShortages(itemId?: string): Promise<MaterialWithRelations[]> {
    return this.db.materialRequirement.findMany({
      where: { status: MaterialStatus.SHORTAGE, itemId },
      include: materialInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  create(data: Prisma.MaterialRequirementUncheckedCreateInput): Promise<MaterialRequirement> {
    return this.db.materialRequirement.create({ data });
  }

  updateStatus(id: string, status: MaterialStatus): Promise<MaterialRequirement> {
    return this.db.materialRequirement.update({ where: { id }, data: { status } });
  }

  countShortagesForWorkOrder(workOrderId: string): Promise<number> {
    return this.db.materialRequirement.count({ where: { workOrderId, status: MaterialStatus.SHORTAGE } });
  }
}
