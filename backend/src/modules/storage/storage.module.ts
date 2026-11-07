import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { FileStorage } from './domain/file-storage';
import { LocalFileStorage } from './providers/local-file.storage';
import { VercelBlobStorage } from './providers/vercel-blob.storage';
import { AttachmentRepository } from './repositories/attachment.repository';
import { AttachmentService } from './services/attachment.service';

@Global()
@Module({
  providers: [
    {
      provide: FileStorage,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): FileStorage =>
        config.storageDriver === 'vercel-blob' ? new VercelBlobStorage(config) : new LocalFileStorage(config),
    },
    AttachmentRepository,
    AttachmentService,
  ],
  exports: [AttachmentService],
})
export class StorageModule {}
