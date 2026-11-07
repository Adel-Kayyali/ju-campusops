import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import {
  EndSubscriptionDto,
  ExtendSubscriptionDto,
  QuoteResponseDto,
  QuoteSubscriptionDto,
  StartSubscriptionDto,
  SubscriptionQueryDto,
  SubscriptionResponseDto,
} from '../dto/subscription.dto';
import { LockerSubscriptionService } from '../services/locker-subscription.service';

@ApiTags('Locker subscriptions')
@ApiBearerAuth()
@Controller('locker-subscriptions')
export class LockerSubscriptionController {
  constructor(private readonly subscriptionService: LockerSubscriptionService) {}

  /** The logged-in student's lockers. */
  @Get('mine')
  @Roles(Role.STUDENT)
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<SubscriptionResponseDto[]> {
    return this.subscriptionService.findMine(user.id);
  }

  @Get()
  @Roles(...RoleGroups.MANAGEMENT)
  search(@Query() query: SubscriptionQueryDto): Promise<PageDto<SubscriptionResponseDto>> {
    return this.subscriptionService.search(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.findOne(id, user);
  }

  @Post('quote')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  quote(@Body() dto: QuoteSubscriptionDto): Promise<QuoteResponseDto> {
    return this.subscriptionService.quote(dto);
  }

  @Post()
  @Roles(...RoleGroups.MANAGEMENT)
  start(@Body() dto: StartSubscriptionDto, @CurrentUser() actor: AuthenticatedUser): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.start(dto, actor);
  }

  @Post(':id/extend')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  extend(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ExtendSubscriptionDto, @CurrentUser() actor: AuthenticatedUser): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.extend(id, dto, actor);
  }

  @Post(':id/end')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  end(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EndSubscriptionDto, @CurrentUser() actor: AuthenticatedUser): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.end(id, dto, actor);
  }
}
