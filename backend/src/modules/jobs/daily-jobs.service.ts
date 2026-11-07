import { Injectable, Logger } from '@nestjs/common';
import { LockerSubscriptionService } from '../lockers/services/locker-subscription.service';
import { PreventiveMaintenanceService } from '../maintenance/services/preventive-maintenance.service';
import { ServiceRequestService } from '../service-requests/services/service-request.service';

export interface DailyJobReport {
  ranAt: string;
  preventiveWorkOrdersGenerated: number;
  requestsEscalated: number;
  lockerRemindersSent: number;
}

/** Everything that must happen once a day (triggered by Vercel Cron or the admin). */
@Injectable()
export class DailyJobsService {
  private readonly logger = new Logger(DailyJobsService.name);

  constructor(
    private readonly maintenanceService: PreventiveMaintenanceService,
    private readonly requestService: ServiceRequestService,
    private readonly subscriptionService: LockerSubscriptionService,
  ) {}

  async runAll(actorId: string | null): Promise<DailyJobReport> {
    const generation = await this.maintenanceService.generateDueWork(actorId);
    const escalated = await this.requestService.escalateOverdue();
    const reminders = await this.subscriptionService.sendExpiryReminders(3);
    const report = {
      ranAt: new Date().toISOString(),
      preventiveWorkOrdersGenerated: generation.generated,
      requestsEscalated: escalated,
      lockerRemindersSent: reminders,
    };
    this.logger.log(`Daily jobs: ${JSON.stringify(report)}`);
    return report;
  }
}
