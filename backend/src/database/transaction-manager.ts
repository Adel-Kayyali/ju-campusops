import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaService } from './prisma.service';

/** Anything that can run Prisma queries: the root client or a transaction client. */
export type DbClient = Prisma.TransactionClient;

/**
 * Declarative transactions for Prisma.
 *
 * The active transaction client is kept in an AsyncLocalStorage, so repositories
 * never need a "tx" parameter: they simply use {@link TransactionManager.client},
 * which returns the current transaction when one is open, or the root client otherwise.
 *
 * Nested calls join the outer transaction (equivalent to Propagation.REQUIRED).
 */
@Injectable()
export class TransactionManager {
  private static instance: TransactionManager | undefined;
  private readonly storage = new AsyncLocalStorage<DbClient>();

  constructor(private readonly prisma: PrismaService) {
    TransactionManager.instance = this;
  }

  /** Used by the {@link Transactional} decorator. */
  static current(): TransactionManager {
    if (!TransactionManager.instance) {
      throw new Error('TransactionManager has not been initialised yet');
    }
    return TransactionManager.instance;
  }

  get client(): DbClient {
    return this.storage.getStore() ?? this.prisma;
  }

  get isActive(): boolean {
    return this.storage.getStore() !== undefined;
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.isActive) {
      return work();
    }
    return this.prisma.$transaction((tx) => this.storage.run(tx, work), {
      maxWait: 10_000,
      timeout: 20_000,
    });
  }
}
