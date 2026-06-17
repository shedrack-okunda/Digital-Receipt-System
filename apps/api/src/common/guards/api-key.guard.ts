import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { StoresService } from '../../modules/stores/stores.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract the authorization token from custom headers
    const apiKey = request.header('x-api-key');

    if (!apiKey) {
      throw new UnauthorizedException(
        'API key is missing from headers (X-API-Key)',
      );
    }

    // Query database via our stores service
    const store = await this.storesService.validateApiKey(apiKey);

    if (!store) {
      throw new UnauthorizedException(
        'Invalid or suspended API key provider credential',
      );
    }

    // Attach the verified store object straight into the request payload
    // This allows down-stream transaction controllers to know who is creating the receipt
    request['store'] = store;

    return true;
  }
}
