import { Injectable } from '@nestjs/common';
import { AssetStatus, Prisma } from '@prisma/client';
import { PageDto, resolveSort } from '../../../common/dto/page.dto';
import { EntityNotFoundException, ResourceConflictException } from '../../../common/exceptions/domain.exceptions';
import { CampusClock } from '../../../common/time/campus-clock';
import { DateOnly } from '../../../common/utils/date-only';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { LocationService } from '../../locations/services/location.service';
import { WARRANTY_WARNING_DAYS, WarrantyStatus } from '../domain/warranty';
import { AssetDetailResponseDto, AssetQueryDto, AssetResponseDto, CreateAssetDto, UpdateAssetDto } from '../dto/asset.dto';
import { AssetMapper } from '../mappers/asset.mapper';
import { AssetRepository, AssetWithLocation } from '../repositories/asset.repository';

const SORTABLE_FIELDS = ['code', 'name', 'type', 'status', 'warrantyExpiry', 'installDate'] as const;
const REPEAT_FAILURE_WINDOW_DAYS = 90;

/** Facilities & asset registry (elevators, HVAC units, lab equipment ...). */
@Injectable()
export class AssetService {
  constructor(
    private readonly repository: AssetRepository,
    private readonly locationService: LocationService,
    private readonly auditService: AuditService,
    private readonly clock: CampusClock,
  ) {}

  async getAsset(id: string): Promise<AssetWithLocation> {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw new EntityNotFoundException('Asset', id);
    }
    return asset;
  }

  async search(query: AssetQueryDto): Promise<PageDto<AssetResponseDto>> {
    const today = this.clock.today();
    const where: Prisma.AssetWhereInput = {
      buildingId: query.buildingId,
      roomId: query.roomId,
      type: query.type,
      status: query.status,
      warrantyExpiry: this.warrantyFilter(query.warranty, today),
      OR: query.search
        ? ['code', 'name', 'serialNumber', 'manufacturer'].map((field) => ({ [field]: { contains: query.search, mode: 'insensitive' } }))
        : undefined,
    };
    const orderBy = resolveSort(query.sortBy, query.sortDir, SORTABLE_FIELDS, 'code');
    const [assets, total] = await this.repository.findPage(where, orderBy, query.skip, query.take);
    return PageDto.of(assets.map((asset) => AssetMapper.toResponse(asset, today)), total, query.page, query.size);
  }

  async findOne(id: string): Promise<AssetDetailResponseDto> {
    const today = this.clock.today();
    const asset = await this.repository.findDetails(id);
    if (!asset) {
      throw new EntityNotFoundException('Asset', id);
    }
    return {
      asset: AssetMapper.toResponse(asset, today),
      maintenanceHistory: asset.workOrders.map((wo) => ({
        workOrderId: wo.id,
        code: wo.code,
        type: wo.type,
        title: wo.title,
        status: wo.status,
        technician: wo.technician?.fullName ?? null,
        createdAt: wo.createdAt.toISOString(),
        completedAt: wo.completedAt?.toISOString() ?? null,
        repairNotes: wo.repairNotes,
      })),
      schedules: asset.schedules.map((schedule) => ({
        id: schedule.id,
        title: schedule.title,
        every: AssetMapper.describeInterval(schedule.intervalValue, schedule.intervalUnit),
        nextDueDate: DateOnly.format(schedule.nextDueDate),
        isActive: schedule.isActive,
      })),
      failuresLast90Days: await this.repository.countCorrectiveSince(id, DateOnly.addDays(today, -REPEAT_FAILURE_WINDOW_DAYS)),
    };
  }

  @Transactional()
  async create(dto: CreateAssetDto, actorId: string): Promise<AssetResponseDto> {
    const code = dto.code.toUpperCase();
    if (await this.repository.findByCode(code)) {
      throw new ResourceConflictException(`Asset ${code} already exists`, 'ASSET_CODE_TAKEN');
    }
    await this.locationService.assertLocation(dto.buildingId, dto.roomId);
    const asset = await this.repository.create({
      ...dto,
      code,
      installDate: dto.installDate ? DateOnly.parse(dto.installDate) : null,
      warrantyExpiry: dto.warrantyExpiry ? DateOnly.parse(dto.warrantyExpiry) : null,
    });
    await this.auditService.record({ actorId, action: AuditAction.ASSET_CREATED, entityType: 'Asset', entityId: asset.id, details: { code } });
    return AssetMapper.toResponse(await this.getAsset(asset.id), this.clock.today());
  }

  @Transactional()
  async update(id: string, dto: UpdateAssetDto, actorId: string): Promise<AssetResponseDto> {
    const existing = await this.getAsset(id);
    if (dto.buildingId || dto.roomId) {
      await this.locationService.assertLocation(dto.buildingId ?? existing.buildingId, dto.roomId === undefined ? existing.roomId : dto.roomId);
    }
    await this.repository.update(id, {
      ...dto,
      installDate: dto.installDate ? DateOnly.parse(dto.installDate) : undefined,
      warrantyExpiry: dto.warrantyExpiry ? DateOnly.parse(dto.warrantyExpiry) : undefined,
    });
    await this.auditService.record({ actorId, action: AuditAction.ASSET_UPDATED, entityType: 'Asset', entityId: id, details: { ...dto } });
    return AssetMapper.toResponse(await this.getAsset(id), this.clock.today());
  }

  /** Called by the work-order workflow (e.g. UNDER_MAINTENANCE while a repair is in progress). */
  async changeStatus(id: string, status: AssetStatus): Promise<void> {
    const asset = await this.getAsset(id);
    if (asset.status !== status && asset.status !== AssetStatus.RETIRED) {
      await this.repository.updateStatus(id, status);
    }
  }

  private warrantyFilter(warranty: WarrantyStatus | undefined, today: Date): Prisma.DateTimeNullableFilter | undefined {
    const warningEnd = DateOnly.addDays(today, WARRANTY_WARNING_DAYS);
    switch (warranty) {
      case WarrantyStatus.NONE:
        return { equals: null };
      case WarrantyStatus.EXPIRED:
        return { lt: today };
      case WarrantyStatus.EXPIRING_SOON:
        return { gte: today, lte: warningEnd };
      case WarrantyStatus.ACTIVE:
        return { gt: warningEnd };
      default:
        return undefined;
    }
  }
}
