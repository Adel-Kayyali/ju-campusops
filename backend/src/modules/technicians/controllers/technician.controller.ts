import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import {
  SuggestionQueryDto,
  TechnicianResponseDto,
  TechnicianSuggestionDto,
  UpdateAvailabilityDto,
  UpdateTechnicianProfileDto,
} from '../dto/technician.dto';
import { TechnicianService } from '../services/technician.service';

@ApiTags('Technicians')
@ApiBearerAuth()
@Controller('technicians')
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Get()
  @Roles(...RoleGroups.FIELD_STAFF)
  findAll(): Promise<TechnicianResponseDto[]> {
    return this.technicianService.findAll();
  }

  /** Ranked technicians for a job, with the reasons behind each score. */
  @Get('suggestions')
  @Roles(...RoleGroups.MANAGEMENT)
  suggest(@Query() query: SuggestionQueryDto): Promise<TechnicianSuggestionDto[]> {
    return this.technicianService.suggest(query);
  }

  /** A technician switches their own availability on/off. */
  @Patch('me/availability')
  @Roles(Role.TECHNICIAN)
  updateMyAvailability(@Body() dto: UpdateAvailabilityDto, @CurrentUser() user: AuthenticatedUser): Promise<TechnicianResponseDto> {
    return this.technicianService.updateProfile(user.id, { isAvailable: dto.isAvailable }, user.id);
  }

  @Patch(':id/profile')
  @Roles(...RoleGroups.MANAGEMENT)
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTechnicianProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TechnicianResponseDto> {
    return this.technicianService.updateProfile(id, dto, user.id);
  }
}
