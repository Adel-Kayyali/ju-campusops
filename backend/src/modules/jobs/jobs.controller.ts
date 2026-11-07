import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CronSecretGuard } from './cron-secret.guard';
import { DailyJobReport, DailyJobsService } from './daily-jobs.service';

@ApiTags('Scheduled jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly dailyJobs: DailyJobsService) {}

  /** Called by Vercel Cron once a day (see vercel.json). */
  @Public()
  @UseGuards(CronSecretGuard)
  @Get('daily')
  runFromCron(): Promise<DailyJobReport> {
    return this.dailyJobs.runAll(null);
  }

  /** Lets the administrator run the daily jobs on demand (useful for the demo). */
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('daily/run')
  @HttpCode(HttpStatus.OK)
  runManually(@CurrentUser() user: AuthenticatedUser): Promise<DailyJobReport> {
    return this.dailyJobs.runAll(user.id);
  }
}
