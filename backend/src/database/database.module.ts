import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SequenceService } from './sequence.service';
import { TransactionManager } from './transaction-manager';

@Global()
@Module({
  providers: [PrismaService, TransactionManager, SequenceService],
  exports: [PrismaService, TransactionManager, SequenceService],
})
export class DatabaseModule {}
