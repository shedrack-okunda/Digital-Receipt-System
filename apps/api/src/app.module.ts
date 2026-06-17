import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { StoresModule } from './modules/stores/stores.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [DatabaseModule, HealthModule, StoresModule, TransactionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
