import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom Parameter Decorator
 * Safely extracts the authenticated store identity from the request context,
 * which was injected by the ApiKeyGuard execution lifecycle.
 */
export const CurrentStore = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.store; // This matches what your ApiKeyGuard sets upon verification
  },
);
