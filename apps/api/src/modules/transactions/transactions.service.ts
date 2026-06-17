import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(storeId: string, dto: CreateTransactionDto) {
    // 1. Run defensive mathematical parsing checks on the incoming payload totals
    this.validatePayloadMathematics(dto);

    // 2. Check if this store has already uploaded this identical POS transaction reference
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

    // 3. Persist transaction data and items together atomically
    return this.prisma.transaction.create({
      data: {
        storeId,
        reference: dto.reference,
        subtotal: dto.subtotal,
        tax: dto.tax,
        total: dto.total,
        currency: dto.currency ?? 'KES',
        status: 'pending',
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity, // Integrity locked
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Defensive Parsing Engine: Verifies that item arrays dynamically match
   * the declared financial parameters to protect system accounting integrity.
   */
  private validatePayloadMathematics(dto: CreateTransactionDto): void {
    let calculatedSubtotal = 0;

    // Sum up the real price of every single line item
    for (const item of dto.items) {
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        throw new BadRequestException(
          `Invalid item properties for "${item.name}". Quantities and prices must be greater than 0.`,
        );
      }

      calculatedSubtotal += item.unitPrice * item.quantity;
    }

    // Check 1: Verify calculated line item sums match the declared subtotal
    if (calculatedSubtotal !== dto.subtotal) {
      throw new BadRequestException(
        `Financial mismatch: The sum of line items (${calculatedSubtotal} cents) does not equal the payload subtotal (${dto.subtotal} cents).`,
      );
    }

    // Check 2: Verify that subtotal + tax adds up perfectly to the declared total
    const expectedTotal = dto.subtotal + dto.tax;
    if (expectedTotal !== dto.total) {
      throw new BadRequestException(
        `Financial mismatch: Subtotal (${dto.subtotal} cents) + Tax (${dto.tax} cents) must equal Total (${dto.total} cents). Received total: ${dto.total} cents.`,
      );
    }
  }
}
