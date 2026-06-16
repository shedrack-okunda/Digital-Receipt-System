import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkSystemHealth() {
    const status = {
      api: 'healthy',
      database: 'unhealthy',
      timestamp: new Date().toISOString(),
    };

    try {
      // Run a raw low-overhead query to verify the Postgres connection pipe
      await this.prisma.$queryRaw`SELECT 1`;
      status.database = 'healthy';
    } catch (error) {
      status.database = `unhealthy: ${error.message}`;
    }

    return status;
  }
}
