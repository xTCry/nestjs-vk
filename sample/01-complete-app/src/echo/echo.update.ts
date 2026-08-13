import { UseFilters, UseGuards } from '@nestjs/common';
import {
  Ctx,
  HearFallback,
  Hears,
  InjectVkApi,
  Message,
  MessageEventContextWithMatch,
  Next,
  On,
  OnMessageEvent,
  Update,
} from 'nestjs-vk';
import { NextMiddleware } from 'middleware-io';
import { Keyboard, MessageContext, MessageEventContext, VK } from 'vk-io';

import { AdminGuard, ReverseTextPipe, VkExceptionFilter } from '../common';
import { Context } from '../interfaces/context.interface';
import { EchoService } from './echo.service';

@Update()
@UseFilters(VkExceptionFilter)
export class EchoUpdate {
  public groupId: number;

  constructor(
    @InjectVkApi()
    private readonly bot: VK,
    private readonly echoService: EchoService,
  ) {}

  async onModuleInit() {
    try {
      const {
        groups: [group],
      } = await this.bot.api.groups.getById({});

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
  async onStartCommand(
    @Ctx() ctx: MessageContext,
    @Next() next: NextMiddleware,
  ) {
    const code = Math.random().toString(32).slice(-6);
    const state = 'wait';
    await ctx.send(`Press callback button [code=${code}]`, {
      keyboard: Keyboard.builder()
        .callbackButton({
          label: 'Request auth',
          payload: `request_auth:${code}:${state}`,
          color: Keyboard.PRIMARY_COLOR,
        })
        .callbackButton({
          label: 'Check fav',
          payload: { check: 'fav' },
          color: Keyboard.SECONDARY_COLOR,
        })
        .callbackButton({
          label: 'nope listener',
          payload: {},
          color: Keyboard.NEGATIVE_COLOR,
        })
        .inline(),
    });
    /* for test */ next();
    return `Hey`;
  }

  @OnMessageEvent(/^request_auth:(?<code>.*):(?<state>.*)/)
  async onMessageEventRequestAuth(@Ctx() ctx: MessageEventContextWithMatch) {
    const { code, state } = ctx.$match?.groups ?? {};

    if (!code || !state) {
      return;
    }

    await ctx.answer({
      type: 'show_snackbar',
      text: `Callback payload parsed: ${code}/${state}`,
    });
  }

  @OnMessageEvent({ check: 'fav' })
  @Hears(['/sub', 'чек'])
  async onSubscriberCommand(
    @Ctx() ctx: MessageContext | MessageEventContextWithMatch,
  ) {
    const isSib = await this.bot.api.groups.isMember({
      group_id: String(this.groupId),
      user_id: ctx.senderId || ctx.userId,
    });
    return isSib ? 'So good!' : 'No sub';
  }

  @Hears('/admin')
  @UseGuards(AdminGuard)
  onAdminCommand(@Ctx() ctx: MessageContext) {
    ctx.send({ sticker_id: 5 });
  }

  @HearFallback()
  onHearFallback(
    @Ctx() ctx: MessageContext | MessageEventContextWithMatch,
    @Message('text', new ReverseTextPipe()) reversedText: string,
  ) {
    if (ctx instanceof MessageEventContext) {
      ctx.answer({ type: 'show_snackbar', text: 'Nope' });
      return;
    }

    if (ctx.is(['message'])) {
      if (reversedText) {
        return this.echoService.echo(reversedText);
      } else if (ctx.hasAttachments('sticker')) {
        ctx.send({ sticker_id: ctx.getAttachments('sticker')[0].id % 24 });
        return;
      }
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
