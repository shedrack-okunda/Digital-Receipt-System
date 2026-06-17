import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(storeId: string, dto: CreateTransactionDto) {
    // 1. Check if this store has already uploaded this identical POS transaction reference
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: {
        storeId_reference: {
          storeId,
          reference: dto.reference,
        },
      },
    });

    if (existingTransaction) {
      throw new ConflictException(
        `Transaction with reference '${dto.reference}' already exists for this store.`,
      );
    }

    // 2. Persist transaction data and items together atomically
    return this.prisma.transaction.create({
      data: {
        storeId,
        reference: dto.reference,
        subtotal: dto.subtotal,
        tax: dto.tax,
        total: dto.total,
        currency: dto.currency ?? 'KES',
        status: 'pending', // Hardcoded initial status until payment layer steps in
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity, // Calculate automatically
          })),
        },
      },
      include: {
        items: true, // Return the saved items in the confirmation response
      },
    });
  }
}
