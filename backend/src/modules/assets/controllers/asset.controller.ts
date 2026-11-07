import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { AssetDetailResponseDto, AssetQueryDto, AssetResponseDto, CreateAssetDto, UpdateAssetDto } from '../dto/asset.dto';
import { AssetService } from '../services/asset.service';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  /** Everyone can search assets (requesters may link a request to an asset). */
  @Get()
  search(@Query() query: AssetQueryDto): Promise<PageDto<AssetResponseDto>> {
    return this.assetService.search(query);
  }

  @Get(':id')
  @Roles(...RoleGroups.FIELD_STAFF)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AssetDetailResponseDto> {
    return this.assetService.findOne(id);
  }

  @Post()
  @Roles(...RoleGroups.MANAGEMENT)
  create(@Body() dto: CreateAssetDto, @CurrentUser() actor: AuthenticatedUser): Promise<AssetResponseDto> {
    return this.assetService.create(dto, actor.id);
  }

  @Patch(':id')
  @Roles(...RoleGroups.MANAGEMENT)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAssetDto, @CurrentUser() actor: AuthenticatedUser): Promise<AssetResponseDto> {
    return this.assetService.update(id, dto, actor.id);
  }
}
