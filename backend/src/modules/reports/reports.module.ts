import { Module } from '@nestjs/common';
import { LockersModule } from '../lockers/lockers.module';
import { ReportController } from './controllers/report.controller';
import { ReportingRepository } from './repositories/reporting.repository';
import { ReportService } from './services/report.service';

@Module({
  imports: [LockersModule],
  controllers: [ReportController],
  providers: [ReportService, ReportingRepository],
})
export class ReportsModule {}
