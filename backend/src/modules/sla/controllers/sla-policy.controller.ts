import { Body, Controller, Get, Param, ParseEnumPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Priority, Role } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { SlaPolicyResponseDto, UpdateSlaPolicyDto } from '../dto/sla-policy.dto';
import { SlaService } from '../services/sla.service';

@ApiTags('SLA policies')
@ApiBearerAuth()
@Controller('sla-policies')
export class SlaPolicyController {
  constructor(private readonly slaService: SlaService) {}

  @Get()
  findAll(): Promise<SlaPolicyResponseDto[]> {
    return this.slaService.findAll();
  }

  @Put(':priority')
  @Roles(Role.ADMIN)
  update(
    @Param('priority', new ParseEnumPipe(Priority)) priority: Priority,
    @Body() dto: UpdateSlaPolicyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SlaPolicyResponseDto> {
    return this.slaService.update(priority, dto, user.id);
  }
}
