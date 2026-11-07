import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import {
  BuildingResponseDto,
  CreateBuildingDto,
  CreateRoomDto,
  RoomResponseDto,
  UpdateBuildingDto,
  UpdateRoomDto,
} from '../dto/location.dto';
import { LocationService } from '../services/location.service';

@ApiTags('Locations')
@ApiBearerAuth()
@Controller()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('buildings')
  findAllBuildings(): Promise<BuildingResponseDto[]> {
    return this.locationService.findAllBuildings();
  }

  @Get('buildings/:id')
  findBuilding(@Param('id', ParseUUIDPipe) id: string): Promise<BuildingResponseDto> {
    return this.locationService.findBuilding(id);
  }

  @Get('buildings/:id/rooms')
  findRooms(@Param('id', ParseUUIDPipe) id: string): Promise<RoomResponseDto[]> {
    return this.locationService.findRooms(id);
  }

  @Post('buildings')
  @Roles(...RoleGroups.MANAGEMENT)
  createBuilding(@Body() dto: CreateBuildingDto, @CurrentUser() actor: AuthenticatedUser): Promise<BuildingResponseDto> {
    return this.locationService.createBuilding(dto, actor.id);
  }

  @Patch('buildings/:id')
  @Roles(...RoleGroups.MANAGEMENT)
  updateBuilding(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBuildingDto, @CurrentUser() actor: AuthenticatedUser): Promise<BuildingResponseDto> {
    return this.locationService.updateBuilding(id, dto, actor.id);
  }

  @Post('buildings/:id/rooms')
  @Roles(...RoleGroups.MANAGEMENT)
  createRoom(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateRoomDto, @CurrentUser() actor: AuthenticatedUser): Promise<RoomResponseDto> {
    return this.locationService.createRoom(id, dto, actor.id);
  }

  @Patch('rooms/:id')
  @Roles(...RoleGroups.MANAGEMENT)
  updateRoom(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoomDto, @CurrentUser() actor: AuthenticatedUser): Promise<RoomResponseDto> {
    return this.locationService.updateRoom(id, dto, actor.id);
  }
}
