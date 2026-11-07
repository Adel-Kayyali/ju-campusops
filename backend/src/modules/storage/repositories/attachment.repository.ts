import { Injectable } from '@nestjs/common';
import { Attachment, Prisma } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

@Injectable()
export class AttachmentRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  create(data: Prisma.AttachmentUncheckedCreateInput): Promise<Attachment> {
    return this.db.attachment.create({ data });
  }
}
