import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { ManagementOverviewDto, PerformanceReportDto, PersonalOverviewDto, ReportQueryDto } from '../dto/report.dto';
import { ReportService } from '../services/report.service';

@ApiTags('Dashboards & reports')
@ApiBearerAuth()
@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard/overview')
  @Roles(...RoleGroups.MANAGEMENT)
  overview(): Promise<ManagementOverviewDto> {
    return this.reportService.managementOverview();
  }

  /** The personal dashboard of the logged-in student / staff member / technician. */
  @Get('dashboard/me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<PersonalOverviewDto> {
    return this.reportService.personalOverview(user);
  }

  @Get('reports/performance')
  @Roles(...RoleGroups.MANAGEMENT)
  performance(@Query() query: ReportQueryDto): Promise<PerformanceReportDto> {
    return this.reportService.performance(query);
  }
}
