import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { StoresModule } from '../stores/stores.module'; // Import to provide StoresService to the guard

@Module({
  imports: [StoresModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
