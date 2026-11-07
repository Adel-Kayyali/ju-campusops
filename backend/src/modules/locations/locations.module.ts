import { Module } from '@nestjs/common';
import { LocationController } from './controllers/location.controller';
import { BuildingRepository } from './repositories/building.repository';
import { LocationService } from './services/location.service';

@Module({
  controllers: [LocationController],
  providers: [LocationService, BuildingRepository],
  exports: [LocationService],
})
export class LocationsModule {}
