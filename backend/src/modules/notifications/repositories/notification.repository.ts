import { Injectable } from '@nestjs/common';
import { Notification, Prisma, Role } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

export interface NewNotification {
  title: string;
  message: string;
  link?: string;
}

@Injectable()
export class NotificationRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  async createForUsers(userIds: string[], notification: NewNotification): Promise<void> {
    if (userIds.length === 0) {
      return;
    }
    await this.db.notification.createMany({
      data: [...new Set(userIds)].map((userId) => ({ userId, ...notification })),
    });
  }

  async findActiveUserIdsByRoles(roles: Role[]): Promise<string[]> {
    const users = await this.db.user.findMany({ where: { role: { in: roles }, isActive: true }, select: { id: true } });
    return users.map((user) => user.id);
  }

  async findPage(where: Prisma.NotificationWhereInput, skip: number, take: number): Promise<[Notification[], number]> {
    return Promise.all([
      this.db.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.notification.count({ where }),
    ]);
  }

  countUnread(userId: string): Promise<number> {
    return this.db.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string): Promise<number> {
    const result = await this.db.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    return result.count;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return result.count;
  }
}
