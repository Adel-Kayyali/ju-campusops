import { Injectable } from '@nestjs/common';
import { Asset, AssetStatus, Prisma, WorkOrderStatus, WorkOrderType } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

const OPEN_WORK_ORDER: Prisma.WorkOrderWhereInput = { status: { in: [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS] } };

export const assetWithLocation = {
  building: { select: { id: true, code: true, name: true } },
  room: { select: { id: true, code: true, name: true } },
  _count: { select: { workOrders: { where: OPEN_WORK_ORDER } } },
} satisfies Prisma.AssetInclude;

export type AssetWithLocation = Prisma.AssetGetPayload<{ include: typeof assetWithLocation }>;

export const assetDetails = {
  ...assetWithLocation,
  workOrders: {
    include: { technician: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  },
  schedules: { orderBy: { nextDueDate: 'asc' } },
} satisfies Prisma.AssetInclude;

export type AssetWithDetails = Prisma.AssetGetPayload<{ include: typeof assetDetails }>;

@Injectable()
export class AssetRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<AssetWithLocation | null> {
    return this.db.asset.findUnique({ where: { id }, include: assetWithLocation });
  }

  findDetails(id: string): Promise<AssetWithDetails | null> {
    return this.db.asset.findUnique({ where: { id }, include: assetDetails });
  }

  findByCode(code: string): Promise<Asset | null> {
    return this.db.asset.findUnique({ where: { code } });
  }

  async findPage(
    where: Prisma.AssetWhereInput,
    orderBy: Prisma.AssetOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<[AssetWithLocation[], number]> {
    return Promise.all([
      this.db.asset.findMany({ where, include: assetWithLocation, orderBy, skip, take }),
      this.db.asset.count({ where }),
    ]);
  }

  countCorrectiveSince(assetId: string, since: Date): Promise<number> {
    return this.db.workOrder.count({ where: { assetId, type: WorkOrderType.CORRECTIVE, createdAt: { gte: since } } });
  }

  create(data: Prisma.AssetUncheckedCreateInput): Promise<Asset> {
    return this.db.asset.create({ data });
  }

  update(id: string, data: Prisma.AssetUncheckedUpdateInput): Promise<Asset> {
    return this.db.asset.update({ where: { id }, data });
  }

  updateStatus(id: string, status: AssetStatus): Promise<Asset> {
    return this.db.asset.update({ where: { id }, data: { status } });
  }
}
