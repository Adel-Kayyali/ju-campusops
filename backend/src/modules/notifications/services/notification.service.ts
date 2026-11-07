import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PageDto } from '../../../common/dto/page.dto';
import { NotificationQueryDto, NotificationResponseDto } from '../dto/notification.dto';
import { NewNotification, NotificationRepository } from '../repositories/notification.repository';

/** In-app notifications (the "bell" in the UI). */
@Injectable()
export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  notifyUser(userId: string | null | undefined, notification: NewNotification): Promise<void> {
    return userId ? this.repository.createForUsers([userId], notification) : Promise.resolve();
  }

  notifyUsers(userIds: string[], notification: NewNotification): Promise<void> {
    return this.repository.createForUsers(userIds, notification);
  }

  async notifyRoles(roles: Role[], notification: NewNotification): Promise<void> {
    const userIds = await this.repository.findActiveUserIdsByRoles(roles);
    await this.repository.createForUsers(userIds, notification);
  }

  async findMine(userId: string, query: NotificationQueryDto): Promise<PageDto<NotificationResponseDto>> {
    const [rows, total] = await this.repository.findPage(
      { userId, readAt: query.unreadOnly ? null : undefined },
      query.skip,
      query.take,
    );
    return PageDto.of(
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        link: row.link,
        isRead: row.readAt !== null,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      query.page,
      query.size,
    );
  }

  countUnread(userId: string): Promise<number> {
    return this.repository.countUnread(userId);
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.repository.markRead(userId, id);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repository.markAllRead(userId);
  }
}
