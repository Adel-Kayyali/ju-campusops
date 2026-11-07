import { DbClient, TransactionManager } from './transaction-manager';

/**
 * Parent class of every repository. Gives access to the transaction-aware Prisma client,
 * so all data access automatically joins the current @Transactional unit of work.
 */
export abstract class BaseRepository {
  protected constructor(private readonly transactionManager: TransactionManager) {}

  protected get db(): DbClient {
    return this.transactionManager.client;
  }
}
