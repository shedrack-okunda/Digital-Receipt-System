import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common'; // Added Get and Param
import { TransactionsService } from './transactions.service';
import { type CreateTransactionDto } from './dto/create-transaction.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentStore } from '../../common/decorators/current-store.decorator';

@Controller('transactions')
@UseGuards(ApiKeyGuard) // Identity barrier active for ALL collection routes
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async ingestTransaction(
    @CurrentStore() store: any,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.createTransaction(store.id, dto);
  }

  @Get()
  async getLedgerEntries(@CurrentStore() store: any) {
    return this.transactionsService.findAllStoreTransactions(store.id);
  }

  @Get(':reference')
  async getReceiptDetails(
    @CurrentStore() store: any,
    @Param('reference') reference: string,
  ) {
    return this.transactionsService.findStoreTransactionByReference(
      store.id,
      reference,
    );
  }
}
