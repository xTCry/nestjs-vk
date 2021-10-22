import { Injectable } from '@nestjs/common';
import { MiddlewareReturn, NextMiddleware } from 'middleware-io';
import { Context } from 'vk-io';

@Injectable()
export class FeaturesMiddleware {
  get middleware() {
    return async (ctx: Context, next: NextMiddleware): Promise<MiddlewareReturn> => {
      if (ctx.is(['message'])) {
        if (ctx.isOutbox) {
          return;
        }
      }

      try {
        await next();
      } catch (error) {
        console.error('Error:', error);
      }
    };
  }
}
