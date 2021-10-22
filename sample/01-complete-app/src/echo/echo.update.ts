import { UseFilters, UseGuards } from '@nestjs/common';
import { InjectVkBot, Update, On, Ctx, Next, Message, Hears, HearFallback } from '../../../../';
import { MessageContext, VK } from 'vk-io';
import { NextMiddleware } from 'middleware-io';

import { EchoService } from './echo.service';
import { Context } from '../interfaces/context.interface';
import { VkExceptionFilter, AdminGuard, ReverseTextPipe } from '../common';

@Update()
@UseFilters(VkExceptionFilter)
export class EchoUpdate {
  public groupId: number;

  constructor(
    @InjectVkBot()
    private readonly bot: VK,
    private readonly echoService: EchoService,
  ) {}

  async onModuleInit() {
    try {
      const [group] = await this.bot.api.groups.getById({});
      this.groupId = group.id;
    } catch (err) {
      console.error(err);
    }
  }

  @On('message')
  onMessageFirst(@Ctx() ctx: Context, @Next() next: NextMiddleware) {
    if (ctx.is(['message'])) {
      // Skip messages
      if (ctx.isOutbox || ctx.isFromGroup) {
        return;
      }
    }

    next();
  }

  @On('message_new', (ctx, next) => {
    console.log('ctx session:', ctx.session);
    ctx.session.cc = (ctx.session.cc || 0) + 1;
    next();
  })
  async onNewMessageSecond(@Next() next: NextMiddleware) {
    try {
      await next();
    } catch (err) {
      console.log('[onNewMessageSecond] Catched exception', err);
    }
  }

  @Hears(/^\/?(start|старт)$/i)
  async onStartCommand(@Next() next: NextMiddleware) {
    /* for test */ next();
    return `Hey`;
  }

  @Hears(['/sub', 'чек'])
  async onSubscriberCommand(@Ctx() ctx: MessageContext) {
    const isSib = await this.bot.api.groups.isMember({
      group_id: String(this.groupId),
      user_id: ctx.senderId,
    });
    return isSib ? 'So good!' : 'No sub';
  }

  @Hears('/admin')
  @UseGuards(AdminGuard)
  onAdminCommand(@Ctx() ctx: MessageContext) {
    ctx.send({ sticker_id: 5 });
  }

  @HearFallback()
  onHearFallback(@Ctx() ctx: MessageContext, @Message('text', new ReverseTextPipe()) reversedText: string) {
    if (reversedText) {
      return this.echoService.echo(reversedText);
    } else if (ctx.hasAttachments('sticker')) {
      ctx.send({ sticker_id: ctx.getAttachments('sticker')[0].id % 24 });
      return;
    }

    return 'What?..';
  }

  @On('message_new')
  async onMessageThird(@Ctx() ctx: Context, @Next() next: NextMiddleware) {
    if (!ctx.session.isAuth) {
      ctx.session.isAuth = true;
      return 'Send any message';
    }
    await next();
  }
}
