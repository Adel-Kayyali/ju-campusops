import { Injectable } from '@nestjs/common';
import { BusinessRuleViolationException, EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { LocationService } from '../../locations/services/location.service';
import { LocationMapper } from '../../locations/mappers/location.mapper';
import { MatchCriteria, rankTechnicians } from '../domain/technician-matching';
import { TechnicianResponseDto, TechnicianSuggestionDto, UpdateTechnicianProfileDto } from '../dto/technician.dto';
import { TechnicianRepository, TechnicianWithProfile } from '../repositories/technician.repository';

/** Technician profiles (skills, home building, availability) and assignment suggestions. */
@Injectable()
export class TechnicianService {
  constructor(
    private readonly repository: TechnicianRepository,
    private readonly locationService: LocationService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(): Promise<TechnicianResponseDto[]> {
    return (await this.repository.findAll(false)).map(toResponse);
  }

  async getTechnician(userId: string): Promise<TechnicianWithProfile> {
    const technician = await this.repository.findById(userId);
    if (!technician) {
      throw new EntityNotFoundException('Technician', userId);
    }
    return technician;
  }

  /** Returns an active technician who can receive work, or throws. */
  async getAssignableTechnician(userId: string): Promise<TechnicianWithProfile> {
    const technician = await this.getTechnician(userId);
    if (!technician.isActive) {
      throw new BusinessRuleViolationException(`${technician.fullName}'s account is deactivated`, 'TECHNICIAN_INACTIVE');
    }
    return technician;
  }

  async suggest(criteria: MatchCriteria): Promise<TechnicianSuggestionDto[]> {
    const technicians = await this.repository.findAll(true);
    return rankTechnicians(
      technicians.map((technician) => ({
        userId: technician.id,
        fullName: technician.fullName,
        skills: technician.technicianProfile?.skills ?? [],
        homeBuildingId: technician.technicianProfile?.homeBuildingId ?? null,
        isAvailable: technician.technicianProfile?.isAvailable ?? true,
        openWorkOrders: technician._count.assignedWorkOrders,
        maxOpenOrders: technician.technicianProfile?.maxOpenOrders ?? 5,
      })),
      criteria,
    );
  }

  @Transactional()
  async updateProfile(userId: string, dto: UpdateTechnicianProfileDto, actorId: string): Promise<TechnicianResponseDto> {
    const technician = await this.getTechnician(userId);
    if (dto.homeBuildingId) {
      await this.locationService.assertLocation(dto.homeBuildingId);
    }
    const current = technician.technicianProfile;
    await this.repository.upsertProfile(userId, {
      skills: dto.skills ?? current?.skills ?? [],
      homeBuildingId: dto.homeBuildingId === undefined ? (current?.homeBuildingId ?? null) : dto.homeBuildingId,
      isAvailable: dto.isAvailable ?? current?.isAvailable ?? true,
      maxOpenOrders: dto.maxOpenOrders ?? current?.maxOpenOrders ?? 5,
    });
    await this.auditService.record({ actorId, action: AuditAction.TECHNICIAN_PROFILE_UPDATED, entityType: 'TechnicianProfile', entityId: userId, details: { ...dto } });
    return toResponse(await this.getTechnician(userId));
  }
}

function toResponse(technician: TechnicianWithProfile): TechnicianResponseDto {
  const profile = technician.technicianProfile;
  return {
    id: technician.id,
    fullName: technician.fullName,
    email: technician.email,
    phone: technician.phone,
    isActive: technician.isActive,
    skills: profile?.skills ?? [],
    homeBuilding: profile?.homeBuilding ? LocationMapper.toBuildingSummary(profile.homeBuilding) : null,
    isAvailable: profile?.isAvailable ?? true,
    maxOpenOrders: profile?.maxOpenOrders ?? 5,
    openWorkOrders: technician._count.assignedWorkOrders,
  };
}
