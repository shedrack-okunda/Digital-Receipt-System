import * as path from 'path';
import * as dotenv from 'dotenv';

// Force dotenv to load the .env file sitting right next to the package config
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@internal/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Now process.env.DATABASE_URL is 100% guaranteed to be loaded before the pool instantiates
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding pipeline...');
  console.log(
    '📡 Connected using connection string:',
    process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@'),
  ); // Safe logging without printing passwords

  const existingStore = await prisma.store.findUnique({
    where: { email: 'nairobi.pos@test.com' },
  });

  if (existingStore) {
    console.log('⚠️ Test merchant already seeded in PostgreSQL.');
    return;
  }

  const store = await prisma.store.create({
    data: {
      name: 'Nairobi Flagship Store',
      email: 'nairobi.pos@test.com',
      phone: '+254700000000',
      status: 'active',
      apiKeys: {
        create: {
          name: 'Main POS Register 1',
          key: 'rcpt_test_hash_2026',
          isActive: true,
        },
      },
    },
  });

  console.log('✅ Seeding complete!');
  console.log(`🏪 Created Store: ${store.name}`);
  console.log('🔑 Active Test API Key: rcpt_test_hash_2026');
}

main()
  .catch((error) => {
    console.error('❌ Seeding operation failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
    void pool.end();
  });
