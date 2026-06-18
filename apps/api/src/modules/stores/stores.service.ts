import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import * as crypto from 'crypto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifies an incoming API key against active database records.
   * Returns the linked store details if valid, otherwise null.
   */
  async validateApiKey(apiKey: string) {
    const keyRecord = await this.prisma.apiKey.findUnique({
      where: {
        key: apiKey,
        isActive: true,
      },
      include: {
        store: true,
      },
    });

    // Ensure the key exists and the store itself is active
    if (!keyRecord || keyRecord.store.status !== 'active') {
      return null;
    }

    // Background task: update the last used timestamp for auditing
    void this.prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    return keyRecord.store;
  }

  /**
   * Enterprise Merchant Provisioning Engine
   * Registers a brand new store and automatically issues an active API key token.
   */
  async registerStore(dto: CreateStoreDto) {
    // 1. Verify email uniqueness
    const existingStore = await this.prisma.store.findUnique({
      where: { email: dto.email },
    });

    if (existingStore) {
      throw new ConflictException(
        `A merchant profile with email '${dto.email}' already exists.`,
      );
    }

    // 2. Generate a secure, unique cryptographically random token string
    const generatedRawKey = `rcpt_live_${crypto.randomBytes(24).toString('hex')}`;

    // 3. Atomically persist both the Store and its default ApiKey row inside a Prisma transaction
    const newStore = await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          status: 'active', // Maps to StoreStatus enum
        },
      });

      await tx.apiKey.create({
        data: {
          storeId: store.id,
          key: generatedRawKey,
          name: 'Default Live Key',
          isActive: true,
        },
      });

      return store;
    });

    // 4. Return clean enterprise data back to client onboarding panel
    return {
      storeId: newStore.id,
      name: newStore.name,
      email: newStore.email,
      credentials: {
        apiKey: generatedRawKey,
        headerMapping: 'X-API-Key',
        status: 'active',
      },
    };
  }

  /**
   * Retrieves a comprehensive roster of all ecosystem merchants.
   */
  async findAllStores() {
    return this.prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * Obtains isolated metadata profile for a single merchant boundary.
   */
  async findStoreById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        apiKeys: {
          select: {
            name: true,
            isActive: true,
            lastUsedAt: true,
          },
        },
      },
    });

    if (!store) {
      throw new BadRequestException(
        `Store with ID '${id}' does not exist inside our directory.`,
      );
    }

    return store;
  }

  /**
   * Corporate Governance Operation
   * Suspends a merchant store and revokes its API key authorization access.
   */
  async suspendStore(id: string) {
    // 1. Verify the target store actually exists
    const store = await this.prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      throw new BadRequestException(
        `Store with ID '${id}' does not exist inside our directory.`,
      );
    }

    // 2. Perform atomic suspension across both Store status and ApiKey tables
    await this.prisma.$transaction(async (tx) => {
      // Update store status to suspended (Enum: 'suspended')
      await tx.store.update({
        where: { id },
        data: { status: 'suspended' },
      });

      // Revoke all API keys bound to this specific store
      await tx.apiKey.updateMany({
        where: { storeId: id },
        data: { isActive: false },
      });
    });

    return {
      storeId: id,
      status: 'suspended',
      message:
        'Merchant boundary successfully suspended. All active API tokens have been immediately revoked.',
    };
  }

  /**
   * Corporate Governance Operation
   * Lifts a merchant suspension and restores API key authorization access.
   */
  async unsuspendStore(id: string) {
    // 1. Verify the target store actually exists
    const store = await this.prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      throw new BadRequestException(
        `Store with ID '${id}' does not exist inside our directory.`,
      );
    }

    // 2. Perform atomic activation across both Store status and ApiKey tables
    await this.prisma.$transaction(async (tx) => {
      // Update store status back to active
      await tx.store.update({
        where: { id },
        data: { status: 'active' },
      });

      // Reactivate their API keys so the POS terminals can connect again
      await tx.apiKey.updateMany({
        where: { storeId: id },
        data: { isActive: true },
      });
    });

    return {
      storeId: id,
      status: 'active',
      message:
        'Merchant boundary successfully unsuspended. API access tokens have been fully restored.',
    };
  }
}
