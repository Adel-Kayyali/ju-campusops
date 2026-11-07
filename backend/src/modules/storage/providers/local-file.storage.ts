import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { AppConfigService } from '../../../config/app-config.service';
import { buildStorageKey, FileStorage, IncomingFile, StoredFile } from '../domain/file-storage';

/** Root folder for files saved on disk (served by Express under /uploads). */
export const LOCAL_UPLOAD_ROOT = join(process.cwd(), 'uploads');

/** Development adapter: writes files to ./uploads. Not suitable for serverless hosting. */
@Injectable()
export class LocalFileStorage extends FileStorage {
  constructor(private readonly config: AppConfigService) {
    super();
  }

  async save(file: IncomingFile, folder: string): Promise<StoredFile> {
    const key = buildStorageKey(folder, file.originalName);
    const target = join(LOCAL_UPLOAD_ROOT, key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.buffer);
    return { url: `${this.config.publicApiUrl}/uploads/${key}` };
  }
}
