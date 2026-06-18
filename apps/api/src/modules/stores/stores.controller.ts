import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common'; // Added Get and Param
import { StoresService } from './stores.service';
import { type CreateStoreDto } from './dto/create-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post('register')
  async registerNewMerchant(@Body() dto: CreateStoreDto) {
    return this.storesService.registerStore(dto);
  }

  @Get()
  async getAllMerchants() {
    return this.storesService.findAllStores();
  }

  @Get(':id')
  async getMerchantProfile(@Param('id') id: string) {
    return this.storesService.findStoreById(id);
  }

  @Patch(':id/suspend')
  async administrativeStoreSuspension(@Param('id') id: string) {
    return this.storesService.suspendStore(id);
  }

  @Patch(':id/unsuspend')
  async administrativeStoreActivation(@Param('id') id: string) {
    return this.storesService.unsuspendStore(id);
  }
}
