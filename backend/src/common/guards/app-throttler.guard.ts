import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Bypass rate limiting for WebSocket context to prevent res.header errors
    if (context.getType() === 'ws') {
      return true;
    }
    return super.canActivate(context);
  }
}
