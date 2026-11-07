import { Injectable } from '@nestjs/common';
import { Room } from '@prisma/client';
import { BusinessRuleViolationException, EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import {
  BuildingResponseDto,
  CreateBuildingDto,
  CreateRoomDto,
  RoomResponseDto,
  UpdateBuildingDto,
  UpdateRoomDto,
} from '../dto/location.dto';
import { LocationMapper } from '../mappers/location.mapper';
import { BuildingRepository, BuildingWithCounts } from '../repositories/building.repository';

/** Campus buildings and rooms (the "where" of every request, asset and locker). */
@Injectable()
export class LocationService {
  constructor(
    private readonly repository: BuildingRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAllBuildings(): Promise<BuildingResponseDto[]> {
    return (await this.repository.findAll()).map(LocationMapper.toBuildingResponse);
  }

  async getBuilding(id: string): Promise<BuildingWithCounts> {
    const building = await this.repository.findById(id);
    if (!building) {
      throw new EntityNotFoundException('Building', id);
    }
    return building;
  }

  async findBuilding(id: string): Promise<BuildingResponseDto> {
    return LocationMapper.toBuildingResponse(await this.getBuilding(id));
  }

  async findRooms(buildingId: string): Promise<RoomResponseDto[]> {
    await this.getBuilding(buildingId);
    return (await this.repository.findRooms(buildingId)).map(LocationMapper.toRoomResponse);
  }

  /** Validates that a building exists and, when given, that the room belongs to it. */
  async assertLocation(buildingId: string, roomId?: string | null): Promise<Room | null> {
    await this.getBuilding(buildingId);
    if (!roomId) {
      return null;
    }
    const room = await this.repository.findRoomById(roomId);
    if (!room) {
      throw new EntityNotFoundException('Room', roomId);
    }
    if (room.buildingId !== buildingId) {
      throw new BusinessRuleViolationException('The selected room is not in the selected building', 'ROOM_NOT_IN_BUILDING');
    }
    return room;
  }

  @Transactional()
  async createBuilding(dto: CreateBuildingDto, actorId: string): Promise<BuildingResponseDto> {
    const building = await this.repository.create({ ...dto, code: dto.code.toUpperCase() });
    await this.auditService.record({ actorId, action: AuditAction.BUILDING_CREATED, entityType: 'Building', entityId: building.id, details: { code: building.code } });
    return this.findBuilding(building.id);
  }

  @Transactional()
  async updateBuilding(id: string, dto: UpdateBuildingDto, actorId: string): Promise<BuildingResponseDto> {
    await this.getBuilding(id);
    await this.repository.update(id, dto);
    await this.auditService.record({ actorId, action: AuditAction.BUILDING_UPDATED, entityType: 'Building', entityId: id, details: { ...dto } });
    return this.findBuilding(id);
  }

  @Transactional()
  async createRoom(buildingId: string, dto: CreateRoomDto, actorId: string): Promise<RoomResponseDto> {
    await this.getBuilding(buildingId);
    const room = await this.repository.createRoom({ ...dto, code: dto.code.toUpperCase(), buildingId });
    await this.auditService.record({ actorId, action: AuditAction.ROOM_CREATED, entityType: 'Room', entityId: room.id, details: { code: room.code } });
    return LocationMapper.toRoomResponse(room);
  }

  @Transactional()
  async updateRoom(id: string, dto: UpdateRoomDto, actorId: string): Promise<RoomResponseDto> {
    if (!(await this.repository.findRoomById(id))) {
      throw new EntityNotFoundException('Room', id);
    }
    const room = await this.repository.updateRoom(id, dto);
    await this.auditService.record({ actorId, action: AuditAction.ROOM_UPDATED, entityType: 'Room', entityId: id, details: { ...dto } });
    return LocationMapper.toRoomResponse(room);
  }
}
