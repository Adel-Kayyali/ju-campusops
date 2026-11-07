import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { LocationsModule } from '../locations/locations.module';
import { SlaModule } from '../sla/sla.module';
import { ServiceRequestController } from './controllers/service-request.controller';
import { ServiceRequestRepository } from './repositories/service-request.repository';
import { RequestWorkflowService } from './services/request-workflow.service';
import { ServiceRequestService } from './services/service-request.service';

@Module({
  imports: [LocationsModule, AssetsModule, SlaModule],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService, RequestWorkflowService, ServiceRequestRepository],
  exports: [ServiceRequestService, RequestWorkflowService],
})
export class ServiceRequestsModule {}
