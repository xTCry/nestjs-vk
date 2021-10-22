import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { VkArgumentsHost } from '../../../../../';
import { Context } from '../../interfaces/context.interface';
import { ADMIN_IDS, NOT_ADMIN_MESSAGE } from '../guards/admin.guard';

@Catch()
export class VkExceptionFilter implements ExceptionFilter {
  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const vkContext = VkArgumentsHost.create(host);
    const ctx = vkContext.getContext<Context>();

    if (exception.message === NOT_ADMIN_MESSAGE) {
      await ctx.reply('You are not admin 😡');
    } else if (ADMIN_IDS.includes(ctx.senderId)) {
      await ctx.reply(`Error: ${exception.message}`);
    } else {
      console.error(exception);
    }
  }
}
