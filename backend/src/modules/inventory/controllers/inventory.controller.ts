import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import {
  AdjustStockDto,
  CreateInventoryItemDto,
  InventoryItemDetailDto,
  InventoryItemResponseDto,
  InventoryQueryDto,
  MaterialResponseDto,
  UpdateInventoryItemDto,
} from '../dto/inventory.dto';
import { InventoryService } from '../services/inventory.service';
import { MaterialAllocationService } from '../services/material-allocation.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@Roles(...RoleGroups.FIELD_STAFF)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly allocationService: MaterialAllocationService,
  ) {}

  @Get('items')
  search(@Query() query: InventoryQueryDto): Promise<InventoryItemResponseDto[]> {
    return this.inventoryService.search(query);
  }

  /** Every work-order requirement currently blocked by missing stock. */
  @Get('shortages')
  shortages(): Promise<MaterialResponseDto[]> {
    return this.allocationService.listShortages();
  }

  @Get('items/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<InventoryItemDetailDto> {
    return this.inventoryService.findOne(id);
  }

  @Post('items')
  @Roles(...RoleGroups.MANAGEMENT)
  create(@Body() dto: CreateInventoryItemDto, @CurrentUser() actor: AuthenticatedUser): Promise<InventoryItemResponseDto> {
    return this.inventoryService.create(dto, actor.id);
  }

  @Patch('items/:id')
  @Roles(...RoleGroups.MANAGEMENT)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInventoryItemDto, @CurrentUser() actor: AuthenticatedUser): Promise<InventoryItemResponseDto> {
    return this.inventoryService.update(id, dto, actor.id);
  }

  @Post('items/:id/adjust')
  @Roles(...RoleGroups.MANAGEMENT)
  adjust(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustStockDto, @CurrentUser() actor: AuthenticatedUser): Promise<InventoryItemResponseDto> {
    return this.inventoryService.adjustStock(id, dto, actor.id);
  }
}
