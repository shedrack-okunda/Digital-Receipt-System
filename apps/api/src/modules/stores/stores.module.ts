import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';

@Module({
  providers: [StoresService],
  exports: [StoresService], // Crucial: Allows our Guard to inject this service
})
export class StoresModule {}
