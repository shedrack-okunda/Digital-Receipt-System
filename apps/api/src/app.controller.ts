import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiKeyGuard } from './common/guards/api-key.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // protected endpoint to verify our custom authentication layer
  @Get('protected-route')
  @UseGuards(ApiKeyGuard)
  getProtectedData(@Request() req: any) {
    return {
      message: 'Access granted successfully!',
      authenticatedStore: req.store, // Extracted directly by our header verification guard
    };
  }
}
