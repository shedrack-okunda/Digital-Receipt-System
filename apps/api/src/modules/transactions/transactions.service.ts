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
    // 1. Convert client decimals to safe database integers (cents) for processing
    const centsSubtotal = Math.round(dto.subtotal * 100);
    const centsTax = Math.round(dto.tax * 100);
    const centsTotal = Math.round(dto.total * 100);

    // 2. Validate mathematics using the safe integer figures
    this.validatePayloadMathematics(
      centsSubtotal,
      centsTax,
      centsTotal,
      dto.items,
    );

    // 3. Enforce unique POS reference checks per store boundary
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

    // 4. Milestone A: Resolve or Dynamically Provision the Customer Profile
    const customer = await this.resolveOrCreateCustomer(dto.customer);

    // 5. Persist everything atomically to the database tier
    const record = await this.prisma.transaction.create({
      data: {
        storeId,
        customerId: customer.id,
        reference: dto.reference,
        subtotal: centsSubtotal,
        tax: centsTax,
        total: centsTotal,
        currency: dto.currency ?? 'KES',
        status: 'pending',
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: Math.round(item.unitPrice * 100),
            totalPrice: Math.round(item.unitPrice * 100) * item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 6. Ingestion Response Transformer: Format response into clean enterprise output
    return this.transformToEnterpriseResponse(record, customer);
  }

  /**
   * Looks up an existing customer by unique identifiers or seeds them on the fly.
   */
  private async resolveOrCreateCustomer(customerDto: any) {
    if (!customerDto.phone) {
      throw new BadRequestException(
        'Customer phone number is required to map transaction identity.',
      );
    }

    // Attempt lookup by phone index
    let customer = await this.prisma.customer.findUnique({
      where: { phone: customerDto.phone },
    });

    // If not found, create a new customer record from the ground up
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          phone: customerDto.phone,
          email: customerDto.email || null,
        },
      });
    }

    return customer;
  }

  /**
   * Internal Parsing Engine checking system calculations using sanitized integer numbers.
   */
  private validatePayloadMathematics(
    subtotal: number,
    tax: number,
    total: number,
    items: any[],
  ): void {
    let calculatedSubtotal = 0;

    for (const item of items) {
      const itemUnitPriceCents = Math.round(item.unitPrice * 100);
      if (item.quantity <= 0 || itemUnitPriceCents <= 0) {
        throw new BadRequestException(`Invalid properties for "${item.name}".`);
      }
      calculatedSubtotal += itemUnitPriceCents * item.quantity;
    }

    if (calculatedSubtotal !== subtotal) {
      throw new BadRequestException(
        `Financial mismatch: Line items sum up to ${calculatedSubtotal / 100}, but payload subtotal says ${subtotal / 100}.`,
      );
    }

    if (subtotal + tax !== total) {
      throw new BadRequestException(
        `Financial mismatch: Subtotal (${subtotal / 100}) + Tax (${tax / 100}) must equal Total (${total / 100}).`,
      );
    }
  }

  /**
   * Enterprise Response Transformer
   * Converts database cents back to clean decimals and hides internal database IDs.
   */
  private transformToEnterpriseResponse(
    transactionRecord: any,
    customerRecord: any,
  ) {
    return {
      transactionId: transactionRecord.reference,
      status: transactionRecord.status,
      currency: transactionRecord.currency,
      financials: {
        subtotal: parseFloat((transactionRecord.subtotal / 100).toFixed(2)),
        tax: parseFloat((transactionRecord.tax / 100).toFixed(2)),
        total: parseFloat((transactionRecord.total / 100).toFixed(2)),
      },
      customer: customerRecord
        ? {
            customerRef: customerRecord.phone,
            email: customerRecord.email,
          }
        : null,
      lineItems: transactionRecord.items.map((item: any) => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: parseFloat((item.unitPrice / 100).toFixed(2)),
        totalPrice: parseFloat((item.totalPrice / 100).toFixed(2)),
      })),
      timestamp: transactionRecord.createdAt,
    };
  }

  /**
   * Retrieves all historical transactions belonging strictly to the executing store.
   */
  async findAllStoreTransactions(storeId: string) {
    const records = await this.prisma.transaction.findMany({
      where: { storeId },
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) =>
      this.transformToEnterpriseResponse(record, record.customer),
    );
  }

  /**
   * Obtains a singular transaction record by reference ID, scoped to the calling store.
   */
  async findStoreTransactionByReference(storeId: string, reference: string) {
    const record = await this.prisma.transaction.findUnique({
      where: {
        storeId_reference: {
          storeId,
          reference,
        },
      },
      include: { items: true, customer: true },
    });

    if (!record) {
      throw new BadRequestException(
        `Transaction receipt '${reference}' was not found for this account.`,
      );
    }

    return this.transformToEnterpriseResponse(record, record.customer);
  }
}
