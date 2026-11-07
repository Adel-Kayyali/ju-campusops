import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PageDto } from '../../../common/dto/page.dto';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { AddMaterialDto, MaterialResponseDto } from '../../inventory/dto/inventory.dto';
import { AttachmentDto, MAX_ATTACHMENT_BYTES, MAX_FILES_PER_UPLOAD, toIncomingFiles } from '../../storage/services/attachment.service';
import {
  AssignTechnicianDto,
  CreateWorkOrderDto,
  ReasonDto,
  TaskNotesDto,
  WorkOrderDetailDto,
  WorkOrderQueryDto,
  WorkOrderResponseDto,
} from '../dto/work-order.dto';
import { WorkOrderMaterialService } from '../services/work-order-material.service';
import { WorkOrderTaskService } from '../services/work-order-task.service';
import { WorkOrderService } from '../services/work-order.service';

@ApiTags('Work orders')
@ApiBearerAuth()
@Roles(...RoleGroups.FIELD_STAFF)
@Controller('work-orders')
export class WorkOrderController {
  constructor(
    private readonly workOrderService: WorkOrderService,
    private readonly taskService: WorkOrderTaskService,
    private readonly materialService: WorkOrderMaterialService,
  ) {}

  /** Managers see every work order; technicians see the ones assigned to them. */
  @Get()
  search(@Query() query: WorkOrderQueryDto, @CurrentUser() user: AuthenticatedUser): Promise<PageDto<WorkOrderResponseDto>> {
    return this.workOrderService.search(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    return this.workOrderService.findOne(id, user);
  }

  @Post()
  @Roles(...RoleGroups.MANAGEMENT)
  create(@Body() dto: CreateWorkOrderDto, @CurrentUser() user: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    return this.workOrderService.create(dto, user);
  }

  @Post(':id/assign')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignTechnicianDto, @CurrentUser() user: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    return this.workOrderService.assign(id, dto.technicianId, user);
  }

  @Post(':id/cancel')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReasonDto, @CurrentUser() user: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    return this.workOrderService.cancel(id, dto.reason, user);
  }

  @Post(':id/verify')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  verify(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    return this.workOrderService.verify(id, user);
  }

  // ---- tasks ----

  @Post(':id/tasks/:taskId/start')
  @HttpCode(HttpStatus.OK)
  startTask(@Param('id', ParseUUIDPipe) id: string, @Param('taskId', ParseUUIDPipe) taskId: string, @CurrentUser() user: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    return this.taskService.startTask(id, taskId, user);
  }

  @Post(':id/tasks/:taskId/complete')
  @HttpCode(HttpStatus.OK)
  completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: TaskNotesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkOrderDetailDto> {
    return this.taskService.completeTask(id, taskId, dto.notes, user);
  }

  @Post(':id/tasks/:taskId/skip')
  @Roles(...RoleGroups.MANAGEMENT)
  @HttpCode(HttpStatus.OK)
  skipTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: ReasonDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkOrderDetailDto> {
    return this.taskService.skipTask(id, taskId, dto.reason, user);
  }

  // ---- materials ----

  @Post(':id/materials')
  addMaterial(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddMaterialDto, @CurrentUser() user: AuthenticatedUser): Promise<MaterialResponseDto[]> {
    return this.materialService.add(id, dto.itemId, dto.quantity, user);
  }

  @Post(':id/materials/:materialId/consume')
  @HttpCode(HttpStatus.OK)
  consumeMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MaterialResponseDto[]> {
    return this.materialService.consume(id, materialId, user);
  }

  @Post(':id/materials/:materialId/release')
  @HttpCode(HttpStatus.OK)
  releaseMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MaterialResponseDto[]> {
    return this.materialService.release(id, materialId, user);
  }

  // ---- evidence ----

  @Post(':id/attachments')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_PER_UPLOAD, { limits: { fileSize: MAX_ATTACHMENT_BYTES } }))
  addEvidence(@Param('id', ParseUUIDPipe) id: string, @UploadedFiles() files: Express.Multer.File[], @CurrentUser() user: AuthenticatedUser): Promise<AttachmentDto[]> {
    return this.workOrderService.addEvidence(id, toIncomingFiles(files), user);
  }
}
