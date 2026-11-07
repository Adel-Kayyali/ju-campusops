import { Module } from '@nestjs/common';
import { SlaPolicyController } from './controllers/sla-policy.controller';
import { SlaPolicyRepository } from './repositories/sla-policy.repository';
import { SlaService } from './services/sla.service';

@Module({
  controllers: [SlaPolicyController],
  providers: [SlaService, SlaPolicyRepository],
  exports: [SlaService],
})
export class SlaModule {}
