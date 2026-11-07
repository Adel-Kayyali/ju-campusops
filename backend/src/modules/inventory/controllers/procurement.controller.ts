import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { CreateProcurementDto, ProcurementDecisionDto, ProcurementQueryDto, ProcurementResponseDto } from '../dto/inventory.dto';
import { ProcurementService } from '../services/procurement.service';

@ApiTags('Procurement')
@ApiBearerAuth()
@Controller('procurement-requests')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get()
  @Roles(...RoleGroups.FIELD_STAFF)
  search(@Query() query: ProcurementQueryDto): Promise<PageDto<ProcurementResponseDto>> {
    return this.procurementService.search(query);
  }

  /** Technicians can ask for parts; managers approve. */
  @Post()
  @Roles(...RoleGroups.FIELD_STAFF)
  create(@Body() dto: CreateProcurementDto, @CurrentUser() actor: AuthenticatedUser): Promise<ProcurementResponseDto> {
    return this.procurementService.create(dto, actor.id);
  }

  @Post(':id/approve')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  approve(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ProcurementDecisionDto, @CurrentUser() actor: AuthenticatedUser): Promise<ProcurementResponseDto> {
    return this.procurementService.approve(id, dto, actor.id);
  }

  @Post(':id/reject')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ProcurementDecisionDto, @CurrentUser() actor: AuthenticatedUser): Promise<ProcurementResponseDto> {
    return this.procurementService.reject(id, dto, actor.id);
  }

  @Post(':id/receive')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  receive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser): Promise<ProcurementResponseDto> {
    return this.procurementService.receive(id, actor.id);
  }
}
