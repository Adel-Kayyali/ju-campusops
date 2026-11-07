import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';
import { CampusClock } from '../../../common/time/campus-clock';
import { DateOnly } from '../../../common/utils/date-only';
import { Transactional } from '../../../database/transactional.decorator';
import { AssetMapper } from '../../assets/mappers/asset.mapper';
import { AssetService } from '../../assets/services/asset.service';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { TechnicianService } from '../../technicians/services/technician.service';
import { WorkOrderService } from '../../work-orders/services/work-order.service';
import { ScheduleCalculator } from '../domain/schedule-calculator';
import { CreateScheduleDto, GenerationResultDto, ScheduleQueryDto, ScheduleResponseDto, UpdateScheduleDto } from '../dto/schedule.dto';
import { ScheduleRepository, ScheduleWithAsset } from '../repositories/schedule.repository';

/** Longest lead time we look ahead when searching for schedules to generate. */
const MAX_LEAD_DAYS = 60;

/** Recurring inspections that turn into planned work orders before equipment becomes overdue. */
@Injectable()
export class PreventiveMaintenanceService {
  constructor(
    private readonly repository: ScheduleRepository,
    private readonly assetService: AssetService,
    private readonly technicianService: TechnicianService,
    private readonly workOrderService: WorkOrderService,
    private readonly auditService: AuditService,
    private readonly clock: CampusClock,
  ) {}

  async findAll(query: ScheduleQueryDto): Promise<ScheduleResponseDto[]> {
    const today = this.clock.today();
    const schedules = await this.repository.findAll({ assetId: query.assetId, isActive: query.activeOnly ? true : undefined });
    return schedules.map((schedule) => this.toResponse(schedule, today));
  }

  @Transactional()
  async create(dto: CreateScheduleDto, actorId: string): Promise<ScheduleResponseDto> {
    await this.assetService.getAsset(dto.assetId);
    if (dto.defaultTechnicianId) await this.technicianService.getTechnician(dto.defaultTechnicianId);
    const schedule = await this.repository.create({ ...dto, nextDueDate: DateOnly.parse(dto.nextDueDate) });
    await this.auditService.record({ actorId, action: AuditAction.SCHEDULE_CREATED, entityType: 'PreventiveSchedule', entityId: schedule.id, details: { title: dto.title } });
    return this.toResponse(await this.getSchedule(schedule.id), this.clock.today());
  }

  @Transactional()
  async update(id: string, dto: UpdateScheduleDto, actorId: string): Promise<ScheduleResponseDto> {
    await this.getSchedule(id);
    if (dto.defaultTechnicianId) await this.technicianService.getTechnician(dto.defaultTechnicianId);
    await this.repository.update(id, { ...dto, nextDueDate: dto.nextDueDate ? DateOnly.parse(dto.nextDueDate) : undefined });
    await this.auditService.record({ actorId, action: AuditAction.SCHEDULE_UPDATED, entityType: 'PreventiveSchedule', entityId: id, details: { ...dto } });
    return this.toResponse(await this.getSchedule(id), this.clock.today());
  }

  /**
   * Creates a planned work order for every active schedule entering its lead window,
   * then moves the schedule to its next due date. Safe to run several times a day:
   * a schedule that still has an open work order is skipped.
   */
  @Transactional()
  async generateDueWork(actorId: string | null): Promise<GenerationResultDto> {
    const today = this.clock.today();
    const candidates = await this.repository.findActiveDueBy(DateOnly.addDays(today, MAX_LEAD_DAYS));
    const created: GenerationResultDto['workOrders'] = [];

    for (const schedule of candidates) {
      if (!ScheduleCalculator.isDueForGeneration(schedule.nextDueDate, schedule.leadDays, today) || schedule._count.workOrders > 0) {
        continue;
      }
      const workOrder = await this.workOrderService.createPreventive(
        {
          scheduleId: schedule.id,
          assetId: schedule.assetId,
          title: `${schedule.title} - ${schedule.asset.code}`,
          description: schedule.description,
          priority: schedule.priority,
          dueAt: new Date(DateOnly.addDays(schedule.nextDueDate, 1).getTime() - 1),
          technicianId: schedule.defaultTechnicianId,
        },
        actorId,
      );
      await this.repository.update(schedule.id, {
        nextDueDate: ScheduleCalculator.nextAfter(schedule.nextDueDate, schedule.intervalValue, schedule.intervalUnit, today),
        lastGeneratedAt: new Date(),
      });
      created.push({ id: workOrder.id, code: workOrder.code, title: workOrder.title });
    }

    if (created.length > 0) {
      await this.auditService.record({ actorId, action: AuditAction.PREVENTIVE_WORK_GENERATED, entityType: 'PreventiveSchedule', details: { workOrders: created.map((w) => w.code) } });
    }
    return { generated: created.length, workOrders: created };
  }

  private async getSchedule(id: string): Promise<ScheduleWithAsset> {
    const schedule = await this.repository.findById(id);
    if (!schedule) {
      throw new EntityNotFoundException('PreventiveSchedule', id);
    }
    return schedule;
  }

  private toResponse(schedule: ScheduleWithAsset, today: Date): ScheduleResponseDto {
    return {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      asset: schedule.asset,
      intervalValue: schedule.intervalValue,
      intervalUnit: schedule.intervalUnit,
      every: AssetMapper.describeInterval(schedule.intervalValue, schedule.intervalUnit),
      nextDueDate: DateOnly.format(schedule.nextDueDate),
      leadDays: schedule.leadDays,
      priority: schedule.priority,
      defaultTechnicianId: schedule.defaultTechnicianId,
      isActive: schedule.isActive,
      isDueForGeneration: schedule.isActive && ScheduleCalculator.isDueForGeneration(schedule.nextDueDate, schedule.leadDays, today),
      openWorkOrders: schedule._count.workOrders,
      lastGeneratedAt: schedule.lastGeneratedAt?.toISOString() ?? null,
    };
  }
}
