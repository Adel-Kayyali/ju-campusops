import { Global, Module } from '@nestjs/common';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditService } from './services/audit.service';

/** Global so every feature module can inject AuditService without importing this module. */
@Global()
@Module({
  controllers: [AuditLogController],
  providers: [AuditService, AuditLogRepository],
  exports: [AuditService],
})
export class AuditModule {}
