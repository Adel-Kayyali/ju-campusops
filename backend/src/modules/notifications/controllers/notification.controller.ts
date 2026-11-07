import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { NotificationQueryDto, NotificationResponseDto, UnreadCountDto } from '../dto/notification.dto';
import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() query: NotificationQueryDto): Promise<PageDto<NotificationResponseDto>> {
    return this.notificationService.findMine(user.id, query);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<UnreadCountDto> {
    return { count: await this.notificationService.countUnread(user.id) };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.notificationService.markAllRead(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.notificationService.markRead(user.id, id);
  }
}
