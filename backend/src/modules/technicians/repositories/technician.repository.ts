import { Injectable } from '@nestjs/common';
import { Prisma, Role, TechnicianProfile, WorkOrderStatus } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

const OPEN_STATUSES = [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS];

export const technicianInclude = {
  technicianProfile: { include: { homeBuilding: { select: { id: true, code: true, name: true } } } },
  _count: { select: { assignedWorkOrders: { where: { status: { in: OPEN_STATUSES } } } } },
} satisfies Prisma.UserInclude;

export type TechnicianWithProfile = Prisma.UserGetPayload<{ include: typeof technicianInclude }>;

@Injectable()
export class TechnicianRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findAll(activeOnly: boolean): Promise<TechnicianWithProfile[]> {
    return this.db.user.findMany({
      where: { role: Role.TECHNICIAN, isActive: activeOnly ? true : undefined },
      include: technicianInclude,
      orderBy: { fullName: 'asc' },
    });
  }

  findById(userId: string): Promise<TechnicianWithProfile | null> {
    return this.db.user.findFirst({ where: { id: userId, role: Role.TECHNICIAN }, include: technicianInclude });
  }

  upsertProfile(userId: string, data: Omit<Prisma.TechnicianProfileUncheckedCreateInput, 'userId'>): Promise<TechnicianProfile> {
    return this.db.technicianProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  }
}
