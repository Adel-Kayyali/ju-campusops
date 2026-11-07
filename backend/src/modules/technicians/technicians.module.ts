import { Module } from '@nestjs/common';
import { LocationsModule } from '../locations/locations.module';
import { TechnicianController } from './controllers/technician.controller';
import { TechnicianRepository } from './repositories/technician.repository';
import { TechnicianService } from './services/technician.service';

@Module({
  imports: [LocationsModule],
  controllers: [TechnicianController],
  providers: [TechnicianService, TechnicianRepository],
  exports: [TechnicianService],
})
export class TechniciansModule {}
