import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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
}
