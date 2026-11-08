import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import {
  ReplaceScheduleDto,
  SetTeacherStatusDto,
  TeacherDetailDto,
  TeacherQueryDto,
  TeacherResponseDto,
  UpdateMyTeacherProfileDto,
} from '../dto/teacher.dto';
import { TeacherService } from '../services/teacher.service';

/**
 * Teachers directory.
 * - Any logged-in user can search teachers and read their profile, status and timetable.
 * - Only a teacher can change data, and only his own: the "me" endpoints always use the
 *   id of the authenticated user. There is deliberately no endpoint to change another
 *   teacher's status (not even for administrators).
 */
@ApiTags('Teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get()
  search(@Query() query: TeacherQueryDto): Promise<PageDto<TeacherResponseDto>> {
    return this.teacherService.search(query);
  }

  @Get('departments')
  departments(): Promise<string[]> {
    return this.teacherService.departments();
  }

  @Get('me')
  @Roles(Role.TEACHER)
  getMine(@CurrentUser() user: AuthenticatedUser): Promise<TeacherDetailDto> {
    return this.teacherService.getMine(user.id);
  }

  @Patch('me')
  @Roles(Role.TEACHER)
  updateMyProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMyTeacherProfileDto): Promise<TeacherDetailDto> {
    return this.teacherService.updateMyProfile(user.id, dto);
  }

  @Put('me/schedule')
  @Roles(Role.TEACHER)
  replaceMySchedule(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReplaceScheduleDto): Promise<TeacherDetailDto> {
    return this.teacherService.replaceMySchedule(user.id, dto);
  }

  /** The Free / Busy button. */
  @Put('me/status')
  @Roles(Role.TEACHER)
  setMyStatus(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetTeacherStatusDto): Promise<TeacherDetailDto> {
    return this.teacherService.setMyStatus(user.id, dto.status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TeacherDetailDto> {
    return this.teacherService.findOne(id);
  }
}
