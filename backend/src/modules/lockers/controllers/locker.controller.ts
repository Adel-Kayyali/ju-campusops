import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import {
  CreateLockerDto,
  LockerDetailResponseDto,
  LockerQueryDto,
  LockerResponseDto,
  LockerSummaryDto,
  SetLockerServiceStatusDto,
  UpdateLockerDto,
} from '../dto/locker.dto';
import { LockerService } from '../services/locker.service';

@ApiTags('Lockers')
@ApiBearerAuth()
@Roles(...RoleGroups.MANAGEMENT)
@Controller('lockers')
export class LockerController {
  constructor(private readonly lockerService: LockerService) {}

  @Get()
  search(@Query() query: LockerQueryDto): Promise<PageDto<LockerResponseDto>> {
    return this.lockerService.search(query);
  }

  @Get('summary')
  summary(): Promise<LockerSummaryDto> {
    return this.lockerService.summary();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LockerDetailResponseDto> {
    return this.lockerService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLockerDto, @CurrentUser() actor: AuthenticatedUser): Promise<LockerResponseDto> {
    return this.lockerService.create(dto, actor.id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLockerDto, @CurrentUser() actor: AuthenticatedUser): Promise<LockerResponseDto> {
    return this.lockerService.update(id, dto, actor.id);
  }

  @Patch(':id/service-status')
  setServiceStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetLockerServiceStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LockerResponseDto> {
    return this.lockerService.setServiceStatus(id, dto, actor.id);
  }
}
