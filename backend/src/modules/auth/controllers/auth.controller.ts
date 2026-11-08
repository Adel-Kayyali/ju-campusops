import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { UserResponseDto } from '../../users/dto/user.dto';
import { ChangePasswordDto, LoginDto, LoginResponseDto, RegisterDto } from '../dto/auth.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Limited to LOGIN_MAX_ATTEMPTS per e-mail + IP address per LOGIN_WINDOW_SECONDS (brute-force protection). */
  @Public()
  @UseGuards(ThrottlerGuard)
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  /** Self-service sign-up for students and staff (rate-limited like login). Returns a logged-in session. */
  @Public()
  @UseGuards(ThrottlerGuard)
  @ApiTooManyRequestsResponse({ description: 'Too many attempts' })
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(dto);
  }

  /** Ends the session on every device (all existing tokens of the user become invalid). */
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.authService.logout(user.id);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.authService.me(user.id);
  }

  /** After a successful change the user is signed out everywhere and logs in with the new password. */
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto): Promise<void> {
    return this.authService.changePassword(user.id, dto);
  }
}
