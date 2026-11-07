import { Injectable } from '@nestjs/common';
import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exceptions';
import { FileStorage, IncomingFile } from '../domain/file-storage';
import { AttachmentRepository } from '../repositories/attachment.repository';

export const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
/** Kept under 4.5 MB because that is the request body limit of Vercel functions. */
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 5;

export type AttachmentOwner = { requestId: string } | { workOrderId: string };

export interface AttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

/** Validates, stores and records photos / evidence files. */
@Injectable()
export class AttachmentService {
  constructor(
    private readonly storage: FileStorage,
    private readonly repository: AttachmentRepository,
  ) {}

  async attach(owner: AttachmentOwner, files: IncomingFile[], uploadedById: string): Promise<AttachmentDto[]> {
    this.validate(files);
    const folder = 'requestId' in owner ? `requests/${owner.requestId}` : `work-orders/${owner.workOrderId}`;
    const saved: AttachmentDto[] = [];
    for (const file of files) {
      const stored = await this.storage.save(file, folder);
      const attachment = await this.repository.create({
        ...owner,
        fileName: file.originalName,
        contentType: file.contentType,
        sizeBytes: file.sizeBytes,
        url: stored.url,
        uploadedById,
      });
      saved.push(AttachmentService.toDto(attachment));
    }
    return saved;
  }

  static toDto(attachment: { id: string; fileName: string; contentType: string; sizeBytes: number; url: string; createdAt: Date }): AttachmentDto {
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
      url: attachment.url,
      createdAt: attachment.createdAt.toISOString(),
    };
  }

  private validate(files: IncomingFile[]): void {
    if (files.length === 0) {
      throw new BusinessRuleViolationException('At least one file is required', 'NO_FILES');
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      throw new BusinessRuleViolationException(`At most ${MAX_FILES_PER_UPLOAD} files can be uploaded at once`, 'TOO_MANY_FILES');
    }
    for (const file of files) {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.contentType)) {
        throw new BusinessRuleViolationException(`File type ${file.contentType} is not allowed`, 'FILE_TYPE_NOT_ALLOWED');
      }
      if (file.sizeBytes > MAX_ATTACHMENT_BYTES) {
        throw new BusinessRuleViolationException(`File ${file.originalName} is larger than 4 MB`, 'FILE_TOO_LARGE');
      }
    }
  }
}

/** Converts Multer's file objects to the storage-neutral IncomingFile type. */
export function toIncomingFiles(files: Express.Multer.File[] | undefined): IncomingFile[] {
  return (files ?? []).map((file) => ({
    originalName: file.originalname,
    contentType: file.mimetype,
    sizeBytes: file.size,
    buffer: file.buffer,
  }));
}
