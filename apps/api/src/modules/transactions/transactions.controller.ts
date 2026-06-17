import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { type CreateTransactionDto } from './dto/create-transaction.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Controller('transactions') // Becomes /api/v1/transactions automatically via global prefix
@UseGuards(ApiKeyGuard) // Entire controller is protected by your secure header hash guard
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async ingestTransaction(
    @Body() dto: CreateTransactionDto,
    @Request() req: any,
  ) {
    // req.store was injected securely by our ApiKeyGuard!
    const storeId = req.store.id;

    const transaction = await this.transactionsService.createTransaction(
      storeId,
      dto,
    );

    return {
      success: true,
      message: 'Transaction ingested and recorded successfully',
      data: transaction,
    };
  }
}
