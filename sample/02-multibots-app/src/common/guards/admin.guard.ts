import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { VkExecutionContext, VkException } from 'nestjs-vk';
import { Context } from '../../interfaces/context.interface';

export const NOT_ADMIN_MESSAGE = 'NOT_ADMIN_MESSAGE';
export const ADMIN_IDS: number[] = process.env.ADMIN_IDS?.split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => n > 0);

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = VkExecutionContext.create(context);
    const { senderId } = ctx.getContext<Context>();

    const isAdmin = ADMIN_IDS.includes(senderId);
    if (!isAdmin) {
      throw new VkException(NOT_ADMIN_MESSAGE);
    }

    return true;
  }
}
