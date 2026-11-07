import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { AuditLogQueryDto, AuditLogResponseDto } from '../dto/audit-log.dto';
import { AuditService } from '../services/audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.FACILITY_MANAGER)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  search(@Query() query: AuditLogQueryDto): Promise<PageDto<AuditLogResponseDto>> {
    return this.auditService.search(query);
  }
}
