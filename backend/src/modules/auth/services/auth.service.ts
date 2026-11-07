import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationFailedException } from '../../../common/exceptions/domain.exceptions';
import { AppConfigService } from '../../../config/app-config.service';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { UserResponseDto } from '../../users/dto/user.dto';
import { UserMapper } from '../../users/mappers/user.mapper';
import { UserRepository } from '../../users/repositories/user.repository';
import { PasswordHasher } from '../../users/services/password-hasher.service';
import { UserService } from '../../users/services/user.service';
import { ChangePasswordDto, LoginDto, LoginResponseDto } from '../dto/auth.dto';

/** Authenticates users and issues JWT access tokens. */
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
      throw new AuthenticationFailedException();
    }
    if (!user.isActive) {
      throw new AuthenticationFailedException('This account has been deactivated. Please contact the administrator.');
    }

    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email, name: user.fullName, role: user.role });
    await this.auditService.record({ actorId: user.id, action: AuditAction.USER_LOGGED_IN, entityType: 'User', entityId: user.id });
    return { accessToken, tokenType: 'Bearer', expiresIn: this.config.jwtExpiresIn, user: UserMapper.toResponse(user) };
  }

  me(userId: string): Promise<UserResponseDto> {
    return this.userService.findOne(userId);
  }

  changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    return this.userService.changeOwnPassword(userId, dto.currentPassword, dto.newPassword);
  }
}
