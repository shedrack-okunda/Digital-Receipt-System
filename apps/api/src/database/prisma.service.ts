import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@internal/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    // 1. Establish a native PostgreSQL connection pool pointing to your Docker node
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // 2. Wrap it inside Prisma 7's official driver adapter
    const adapter = new PrismaPg(pool);

    // 3. Construct the base class explicitly using the adapter
    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
