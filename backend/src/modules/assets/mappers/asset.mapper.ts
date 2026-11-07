import { DateOnly } from '../../../common/utils/date-only';
import { LocationMapper } from '../../locations/mappers/location.mapper';
import { warrantyStatus } from '../domain/warranty';
import { AssetResponseDto } from '../dto/asset.dto';
import { AssetWithLocation } from '../repositories/asset.repository';

export class AssetMapper {
  static toResponse(asset: AssetWithLocation, today: Date): AssetResponseDto {
    return {
      id: asset.id,
      code: asset.code,
      name: asset.name,
      type: asset.type,
      status: asset.status,
      building: LocationMapper.toBuildingSummary(asset.building),
      room: LocationMapper.toRoomSummary(asset.room),
      manufacturer: asset.manufacturer,
      model: asset.model,
      serialNumber: asset.serialNumber,
      installDate: asset.installDate ? DateOnly.format(asset.installDate) : null,
      warrantyExpiry: asset.warrantyExpiry ? DateOnly.format(asset.warrantyExpiry) : null,
      warrantyStatus: warrantyStatus(asset.warrantyExpiry, today),
      notes: asset.notes,
      openWorkOrders: asset._count.workOrders,
    };
  }

  static describeInterval(value: number, unit: string): string {
    const label = unit.toLowerCase().replace(/s$/, '');
    return `${value} ${label}${value === 1 ? '' : 's'}`;
  }
}
