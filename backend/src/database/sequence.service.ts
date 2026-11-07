import { Injectable } from '@nestjs/common';
import { TransactionManager } from './transaction-manager';

export enum SequenceName {
  SERVICE_REQUEST = 'SR',
  WORK_ORDER = 'WO',
  RECEIPT = 'RCPT',
  PROCUREMENT = 'PR',
}

/**
 * Generates gap-free, human readable business codes such as SR-000042.
 * The increment is a single atomic UPSERT, so it is safe under concurrency.
 */
@Injectable()
export class SequenceService {
  constructor(private readonly transactionManager: TransactionManager) {}

  async next(sequence: SequenceName): Promise<string> {
    const rows = await this.transactionManager.client.$queryRaw<{ value: number }[]>`
      INSERT INTO "sequences" ("name", "value") VALUES (${sequence}, 1)
      ON CONFLICT ("name") DO UPDATE SET "value" = "sequences"."value" + 1
      RETURNING "value"`;
    return `${sequence}-${String(rows[0].value).padStart(6, '0')}`;
  }
}
