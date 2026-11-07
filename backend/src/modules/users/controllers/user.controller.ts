import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto, UpdateUserStatusDto, UserQueryDto, UserResponseDto } from '../dto/user.dto';
import { UserService } from '../services/user.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** Managers need to look up students (lockers) and technicians (work orders). */
  @Get()
  @Roles(...RoleGroups.MANAGEMENT)
  search(@Query() query: UserQueryDto): Promise<PageDto<UserResponseDto>> {
    return this.userService.search(query);
  }

  @Get(':id')
  @Roles(...RoleGroups.MANAGEMENT)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser): Promise<UserResponseDto> {
    return this.userService.create(dto, actor.id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: AuthenticatedUser): Promise<UserResponseDto> {
    return this.userService.update(id, dto, actor.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserStatusDto, @CurrentUser() actor: AuthenticatedUser): Promise<UserResponseDto> {
    return this.userService.setActive(id, dto.isActive, actor.id);
  }

  @Post(':id/reset-password')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetPasswordDto, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    return this.userService.resetPassword(id, dto, actor.id);
  }
}
