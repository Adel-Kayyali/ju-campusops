import { Building, Room } from '@prisma/client';
import { BuildingResponseDto, BuildingSummaryDto, RoomResponseDto, RoomSummaryDto } from '../dto/location.dto';
import { BuildingWithCounts } from '../repositories/building.repository';

export class LocationMapper {
  static toBuildingResponse(building: BuildingWithCounts): BuildingResponseDto {
    return {
      id: building.id,
      code: building.code,
      name: building.name,
      campus: building.campus,
      floors: building.floors,
      roomCount: building._count.rooms,
      lockerCount: building._count.lockers,
      assetCount: building._count.assets,
    };
  }

  static toRoomResponse(room: Room): RoomResponseDto {
    return { id: room.id, buildingId: room.buildingId, code: room.code, name: room.name, floor: room.floor, type: room.type };
  }

  static toBuildingSummary(building: Pick<Building, 'id' | 'code' | 'name'>): BuildingSummaryDto {
    return { id: building.id, code: building.code, name: building.name };
  }

  static toRoomSummary(room: Pick<Room, 'id' | 'code' | 'name'> | null | undefined): RoomSummaryDto | null {
    return room ? { id: room.id, code: room.code, name: room.name } : null;
  }
}
