import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { CreateScheduleDto, GenerationResultDto, ScheduleQueryDto, ScheduleResponseDto, UpdateScheduleDto } from '../dto/schedule.dto';
import { PreventiveMaintenanceService } from '../services/preventive-maintenance.service';

@ApiTags('Preventive maintenance')
@ApiBearerAuth()
@Controller('maintenance-schedules')
export class ScheduleController {
  constructor(private readonly maintenanceService: PreventiveMaintenanceService) {}

  @Get()
  @Roles(...RoleGroups.FIELD_STAFF)
  findAll(@Query() query: ScheduleQueryDto): Promise<ScheduleResponseDto[]> {
    return this.maintenanceService.findAll(query);
  }

  @Post()
  @Roles(...RoleGroups.MANAGEMENT)
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: AuthenticatedUser): Promise<ScheduleResponseDto> {
    return this.maintenanceService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(...RoleGroups.MANAGEMENT)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateScheduleDto, @CurrentUser() user: AuthenticatedUser): Promise<ScheduleResponseDto> {
    return this.maintenanceService.update(id, dto, user.id);
  }

  /** "Generate now" button (the same logic also runs every day). */
  @Post('generate')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  generate(@CurrentUser() user: AuthenticatedUser): Promise<GenerationResultDto> {
    return this.maintenanceService.generateDueWork(user.id);
  }
}
