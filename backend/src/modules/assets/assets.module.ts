import { Module } from '@nestjs/common';
import { LocationsModule } from '../locations/locations.module';
import { AssetController } from './controllers/asset.controller';
import { AssetRepository } from './repositories/asset.repository';
import { AssetService } from './services/asset.service';

@Module({
  imports: [LocationsModule],
  controllers: [AssetController],
  providers: [AssetService, AssetRepository],
  exports: [AssetService],
})
export class AssetsModule {}
