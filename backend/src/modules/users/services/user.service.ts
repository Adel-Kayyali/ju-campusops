import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { resolveSort, PageDto } from '../../../common/dto/page.dto';
import { BusinessRuleViolationException, EntityNotFoundException, ResourceConflictException } from '../../../common/exceptions/domain.exceptions';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto, UserQueryDto, UserResponseDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UserRepository } from '../repositories/user.repository';
import { PasswordHasher } from './password-hasher.service';

const SORTABLE_FIELDS = ['fullName', 'email', 'role', 'createdAt', 'universityId'] as const;

/** User accounts management (administrators) and lookups used by other modules. */
@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly auditService: AuditService,
  ) {}

  async getById(id: string): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new EntityNotFoundException('User', id);
    }
    return user;
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return UserMapper.toResponse(await this.getById(id));
  }

  /** Returns an active user with the expected role, or throws a business error. */
  async getActiveUserWithRole(id: string, roles: Role[], label: string): Promise<User> {
    const user = await this.getById(id);
    if (!roles.includes(user.role)) {
      throw new BusinessRuleViolationException(`The selected user is not a ${label}`, 'INVALID_USER_ROLE', { expected: roles });
    }
    if (!user.isActive) {
      throw new BusinessRuleViolationException(`The selected ${label} account is deactivated`, 'USER_INACTIVE');
    }
    return user;
  }

  async search(query: UserQueryDto): Promise<PageDto<UserResponseDto>> {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      role: query.role,
      isActive: query.isActive,
      OR: search
        ? [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { universityId: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const orderBy = resolveSort(query.sortBy, query.sortDir, SORTABLE_FIELDS, 'fullName');
    const [users, total] = await this.repository.findPage(where, orderBy, query.skip, query.take);
    return PageDto.of(users.map(UserMapper.toResponse), total, query.page, query.size);
  }

  @Transactional()
  async create(dto: CreateUserDto, actorId: string): Promise<UserResponseDto> {
    const email = dto.email.toLowerCase();
    if (await this.repository.findByEmail(email)) {
      throw new ResourceConflictException(`A user with email ${email} already exists`, 'EMAIL_TAKEN');
    }
    if (dto.role === Role.STUDENT && !dto.universityId) {
      throw new BusinessRuleViolationException('Students must have a university ID', 'UNIVERSITY_ID_REQUIRED');
    }
    const user = await this.repository.create({
      email,
      fullName: dto.fullName,
      role: dto.role,
      universityId: dto.universityId || null,
      phone: dto.phone || null,
      department: dto.department || null,
      passwordHash: await this.passwordHasher.hash(dto.password),
      technicianProfile: dto.role === Role.TECHNICIAN ? { create: { skills: [] } } : undefined,
    });
    await this.auditService.record({ actorId, action: AuditAction.USER_CREATED, entityType: 'User', entityId: user.id, details: { email, role: user.role } });
    return UserMapper.toResponse(user);
  }

  @Transactional()
  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<UserResponseDto> {
    const existing = await this.getById(id);
    if (id === actorId && dto.role && dto.role !== existing.role) {
      throw new BusinessRuleViolationException('You cannot change your own role', 'CANNOT_CHANGE_OWN_ROLE');
    }
    const user = await this.repository.update(id, {
      fullName: dto.fullName,
      role: dto.role,
      universityId: dto.universityId,
      phone: dto.phone,
      department: dto.department,
      technicianProfile:
        dto.role === Role.TECHNICIAN && existing.role !== Role.TECHNICIAN
          ? { connectOrCreate: { where: { userId: id }, create: { skills: [] } } }
          : undefined,
    });
    await this.auditService.record({ actorId, action: AuditAction.USER_UPDATED, entityType: 'User', entityId: id, details: { ...dto } });
    return UserMapper.toResponse(user);
  }

  @Transactional()
  async setActive(id: string, isActive: boolean, actorId: string): Promise<UserResponseDto> {
    if (id === actorId && !isActive) {
      throw new BusinessRuleViolationException('You cannot deactivate your own account', 'CANNOT_DEACTIVATE_SELF');
    }
    await this.getById(id);
    const user = await this.repository.update(id, { isActive });
    await this.auditService.record({
      actorId,
      action: isActive ? AuditAction.USER_ACTIVATED : AuditAction.USER_DEACTIVATED,
      entityType: 'User',
      entityId: id,
    });
    return UserMapper.toResponse(user);
  }

  @Transactional()
  async resetPassword(id: string, dto: ResetPasswordDto, actorId: string): Promise<void> {
    await this.getById(id);
    await this.repository.update(id, { passwordHash: await this.passwordHasher.hash(dto.newPassword) });
    await this.auditService.record({ actorId, action: AuditAction.USER_PASSWORD_RESET, entityType: 'User', entityId: id });
  }

  async changeOwnPassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.getById(id);
    if (!(await this.passwordHasher.matches(currentPassword, user.passwordHash))) {
      throw new BusinessRuleViolationException('The current password is incorrect', 'WRONG_PASSWORD');
    }
    await this.repository.update(id, { passwordHash: await this.passwordHasher.hash(newPassword) });
  }
}
