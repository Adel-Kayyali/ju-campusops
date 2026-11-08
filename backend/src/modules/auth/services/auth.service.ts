import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { AuthenticationFailedException, BusinessRuleViolationException, ResourceConflictException } from '../../../common/exceptions/domain.exceptions';
import { AppConfigService } from '../../../config/app-config.service';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { UserResponseDto } from '../../users/dto/user.dto';
import { UserMapper } from '../../users/mappers/user.mapper';
import { UserRepository } from '../../users/repositories/user.repository';
import { PasswordHasher } from '../../users/services/password-hasher.service';
import { UserService } from '../../users/services/user.service';
import { AccessTokenPayload } from '../domain/session-rules';
import { ChangePasswordDto, LoginDto, LoginResponseDto, RegisterDto } from '../dto/auth.dto';

/** Authenticates users, issues JWT access tokens and ends sessions. */
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    // Same message for "unknown email" and "wrong password" to avoid account enumeration.
    if (!user || !(await this.passwordHasher.matches(dto.password, user.passwordHash))) {
      await this.auditService.record({ actorId: user?.id ?? null, action: AuditAction.USER_LOGIN_FAILED, entityType: 'User', entityId: user?.id ?? null, details: { email: dto.email } });
      throw new AuthenticationFailedException();
    }
    if (!user.isActive) {
      throw new AuthenticationFailedException('This account has been deactivated. Please contact the administrator.');
    }

    const accessToken = await this.issueToken(user);
    await this.auditService.record({ actorId: user.id, action: AuditAction.USER_LOGGED_IN, entityType: 'User', entityId: user.id });
    return { accessToken, tokenType: 'Bearer', expiresIn: this.config.jwtExpiresIn, user: UserMapper.toResponse(user) };
  }

  /**
   * Self-service sign-up (students and staff only). No e-mail verification:
   * the account is active at once and the user is logged in immediately.
   */
  @Transactional()
  async register(dto: RegisterDto): Promise<LoginResponseDto> {
    if (dto.password !== dto.confirmPassword) {
      throw new BusinessRuleViolationException('The two passwords do not match', 'PASSWORD_MISMATCH');
    }
    if (dto.accountType === Role.STUDENT && !dto.universityId) {
      throw new BusinessRuleViolationException('Students must enter their university ID', 'UNIVERSITY_ID_REQUIRED');
    }
    if (await this.userRepository.findByEmail(dto.email)) {
      throw new ResourceConflictException('An account with this e-mail already exists. Try signing in.', 'EMAIL_TAKEN');
    }
    if (dto.universityId && (await this.userRepository.findByUniversityId(dto.universityId))) {
      throw new ResourceConflictException('An account with this university ID already exists', 'UNIVERSITY_ID_TAKEN');
    }

    const user = await this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      role: dto.accountType,
      universityId: dto.universityId || null,
      department: dto.department || null,
      phone: dto.phone || null,
      passwordHash: await this.passwordHasher.hashNewPassword(dto.password, { email: dto.email }),
    });
    await this.auditService.record({ actorId: user.id, action: AuditAction.USER_REGISTERED, entityType: 'User', entityId: user.id, details: { email: user.email, role: user.role } });

    const accessToken = await this.issueToken(user);
    return { accessToken, tokenType: 'Bearer', expiresIn: this.config.jwtExpiresIn, user: UserMapper.toResponse(user) };
  }

  /** Server-side logout: every token issued to this user so far stops working. */
  @Transactional()
  async logout(userId: string): Promise<void> {
    await this.userRepository.revokeSessions(userId);
    await this.auditService.record({ actorId: userId, action: AuditAction.USER_LOGGED_OUT, entityType: 'User', entityId: userId });
  }

  me(userId: string): Promise<UserResponseDto> {
    return this.userService.findOne(userId);
  }

  changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    return this.userService.changeOwnPassword(userId, dto.currentPassword, dto.newPassword);
  }

  private issueToken(user: User): Promise<string> {
    const payload: AccessTokenPayload = { sub: user.id, ver: user.tokenVersion, email: user.email, name: user.fullName, role: user.role };
    return this.jwtService.signAsync(payload);
  }
}
