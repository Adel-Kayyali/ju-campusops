import { Injectable } from '@nestjs/common';
import { Payment, Prisma } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

@Injectable()
export class PaymentRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return this.db.payment.create({ data });
  }

  existsByReceiptNumber(receiptNumber: string): Promise<boolean> {
    return this.db.payment.count({ where: { receiptNumber } }).then((count) => count > 0);
  }

  async sumReceivedBetween(from: Date, to: Date): Promise<number> {
    const result = await this.db.payment.aggregate({ _sum: { amount: true }, where: { receivedAt: { gte: from, lt: to } } });
    return Number(result._sum.amount ?? 0);
  }
}
