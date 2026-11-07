import { Injectable } from '@nestjs/common';
import { put } from '@vercel/blob';
import { AppConfigService } from '../../../config/app-config.service';
import { buildStorageKey, FileStorage, IncomingFile, StoredFile } from '../domain/file-storage';

/** Production adapter: stores files in Vercel Blob (public URLs). */
@Injectable()
export class VercelBlobStorage extends FileStorage {
  constructor(private readonly config: AppConfigService) {
    super();
  }

  async save(file: IncomingFile, folder: string): Promise<StoredFile> {
    const token = this.config.blobToken;
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN is required when STORAGE_DRIVER=vercel-blob');
    }
    const blob = await put(buildStorageKey(folder, file.originalName), file.buffer, {
      access: 'public',
      contentType: file.contentType,
      token,
    });
    return { url: blob.url };
  }
}
