import { Injectable } from '@nestjs/common';
import { Building, Prisma, Room } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

const withCounts = { _count: { select: { rooms: true, lockers: true, assets: true } } } satisfies Prisma.BuildingInclude;
export type BuildingWithCounts = Prisma.BuildingGetPayload<{ include: typeof withCounts }>;

@Injectable()
export class BuildingRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findAll(): Promise<BuildingWithCounts[]> {
    return this.db.building.findMany({ include: withCounts, orderBy: { code: 'asc' } });
  }

  findById(id: string): Promise<BuildingWithCounts | null> {
    return this.db.building.findUnique({ where: { id }, include: withCounts });
  }

  create(data: Prisma.BuildingCreateInput): Promise<Building> {
    return this.db.building.create({ data });
  }

  update(id: string, data: Prisma.BuildingUpdateInput): Promise<Building> {
    return this.db.building.update({ where: { id }, data });
  }

  findRooms(buildingId: string): Promise<Room[]> {
    return this.db.room.findMany({ where: { buildingId }, orderBy: [{ floor: 'asc' }, { code: 'asc' }] });
  }

  findRoomById(id: string): Promise<Room | null> {
    return this.db.room.findUnique({ where: { id } });
  }

  createRoom(data: Prisma.RoomUncheckedCreateInput): Promise<Room> {
    return this.db.room.create({ data });
  }

  updateRoom(id: string, data: Prisma.RoomUncheckedUpdateInput): Promise<Room> {
    return this.db.room.update({ where: { id }, data });
  }
}
