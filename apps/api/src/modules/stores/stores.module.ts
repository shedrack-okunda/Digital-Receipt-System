import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller'; // 1. Import your controller

@Module({
  controllers: [StoresController], // 2. MAKE SURE THIS LINE IS EXPLICITLY HERE
  providers: [StoresService],
  exports: [StoresService], // Exported so TransactionsModule/Guards can read it
})
export class StoresModule {}
