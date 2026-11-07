import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { AttachmentDto, MAX_ATTACHMENT_BYTES, MAX_FILES_PER_UPLOAD, toIncomingFiles } from '../../storage/services/attachment.service';
import {
  ConfirmResolutionDto,
  CreateServiceRequestDto,
  RejectRequestDto,
  ReopenRequestDto,
  ServiceRequestDetailDto,
  ServiceRequestQueryDto,
  ServiceRequestResponseDto,
  StatusNoteDto,
} from '../dto/service-request.dto';
import { ServiceRequestService } from '../services/service-request.service';

@ApiTags('Service requests')
@ApiBearerAuth()
@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly requestService: ServiceRequestService) {}

  @Post()
  submit(@Body() dto: CreateServiceRequestDto, @CurrentUser() user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    return this.requestService.submit(dto, user);
  }

  @Get()
  search(@Query() query: ServiceRequestQueryDto, @CurrentUser() user: AuthenticatedUser): Promise<PageDto<ServiceRequestResponseDto>> {
    return this.requestService.search(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    return this.requestService.findOne(id, user);
  }

  @Post(':id/attachments')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_PER_UPLOAD, { limits: { fileSize: MAX_ATTACHMENT_BYTES } }))
  addAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AttachmentDto[]> {
    return this.requestService.addAttachments(id, toIncomingFiles(files), user);
  }

  @Post(':id/acknowledge')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  acknowledge(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StatusNoteDto, @CurrentUser() user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    return this.requestService.acknowledge(id, dto, user);
  }

  @Post(':id/reject')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectRequestDto, @CurrentUser() user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    return this.requestService.reject(id, dto, user);
  }

  @Post(':id/close')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  close(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StatusNoteDto, @CurrentUser() user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    return this.requestService.close(id, dto, user);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmResolutionDto, @CurrentUser() user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    return this.requestService.confirmResolution(id, dto, user);
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  reopen(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReopenRequestDto, @CurrentUser() user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    return this.requestService.reopen(id, dto, user);
  }
}
