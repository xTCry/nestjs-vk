import { UseFilters, UseGuards } from '@nestjs/common';
import {
  Ctx,
  HearFallback,
  Hears,
  InjectVkApi,
  InjectVkHearManager,
  InjectVkSceneManager,
  InjectVkSessionManager,
  Next,
  On,
  Update,
} from 'nestjs-vk';
import { NextMiddleware } from 'middleware-io';
import { getRandomId, MessageContext, VK } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SceneManager, StepScene } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

import { BestSceneContextState } from 'src/interfaces/best-scene-context-state';

import { AdminGuard, VkExceptionFilter } from '../common';
import { Context } from '../interfaces/context.interface';

@Update()
@UseFilters(VkExceptionFilter)
export class BotPartialUpdate {
  constructor(
    @InjectVkApi('firstBot')
    private readonly firstBot: VK,
    @InjectVkApi('secondBot')
    private readonly secondBot: VK,
    @InjectVkHearManager() // or @Inject(VK_HEAR_MANAGER)
    private readonly hearManagerProvider: HearManager<MessageContext>,
    @InjectVkSessionManager() // or @Inject(VK_SESSION_MANAGER)
    private readonly sessionManagerProvider: SessionManager,
    @InjectVkSceneManager() // or @Inject(VK_SCENE_MANAGER)
    private readonly sceneManager: SceneManager,
  ) {
    this.hearManagerProvider
      .hear('qq', (ctx) => {
        ctx.send('HelloW');
      })
      .hear('ww', (ctx) => {
        return ctx.scene.enter('signup');
      })
      .hear('ff', (ctx) => {
        return ctx.scene.enter('BEST_SCEN');
      });

    this.sceneManager.addScenes([
      new StepScene<MessageContext, BestSceneContextState>('signup', [
        (context) => {
          if (context.scene.step.firstTime || !context.text) {
            return context.send("What's your name?");
          }

          context.scene.state.firstName = context.text;

          return context.scene.step.next();
        },
        (context) => {
          if (context.scene.step.firstTime || !context.text) {
            return context.send('How old are you?');
          }

          context.scene.state.age = context.text;

          return context.scene.step.next();
        },
        async (context) => {
          const { firstName, age } = context.scene.state;

          await context.send(`👤 ${firstName} ${age} ages`);

          return context.scene.step.next(); // Automatic exit, since this is the last scene
        },
      ]),
    ]);
  }

  @On('message')
  async onMessageFirst(@Ctx() ctx: Context, @Next() next: NextMiddleware) {
    if (ctx.is(['message'])) {
      // Skip messages
      if (ctx.isOutbox || ctx.isFromGroup) {
        return;
      }
    }

    try {
      await next();
    } catch (err) {
      console.log('[onNewMessageSecond] Catched exception', err);
    }
  }

  @Hears('/info')
  onInfoCommand() {
    const message = `
    Info:
    • hearManagerProvider.length: ${this.hearManagerProvider.length}
    • sessionManagerProvider.length: ${JSON.stringify(
      this.sessionManagerProvider,
    ).slice(0, 150)}
    `;
    return message;
  }

  @Hears(/^\/?(start|старт)$/i)
  async onStartCommand(@Next() next: NextMiddleware) {
    /* for test */ next();
    return `Hey`;
  }

  @Hears('/admin')
  @UseGuards(AdminGuard)
  onAdminCommand(@Ctx() ctx: MessageContext) {
    ctx.send({ sticker_id: 5 });
  }

  @Hears('/all')
  async onAllCommand(@Ctx() ctx: MessageContext) {
    const message = `HelloW, user. (${ctx.createdAt})`;
    await this.firstBot.api.messages.send({
      peer_ids: ctx.peerId,
      message: `${message} [1]`,
      random_id: getRandomId(),
    });

    await new Promise((r) => setTimeout(r, 2e3));

    await this.secondBot.api.messages.send({
      peer_ids: ctx.peerId,
      message: `${message} [2]`,
      random_id: getRandomId(),
    });
  }

  @HearFallback()
  onHearFallback(@Ctx() ctx: MessageContext) {
    if (ctx.hasAttachments('sticker')) {
      ctx.send({ sticker_id: ctx.getAttachments('sticker')[0].id % 24 });
      return;
    }

    return 'What?..';
  }

  @On('message_new')
  async onMessageAuth(@Ctx() ctx: Context, @Next() next: NextMiddleware) {
    const authRequired = false;

    if (authRequired && !ctx.session.isAuth) {
      if (!ctx.is(['message'])) {
        return 'Need auth! Send any text message';
      }

      if (!ctx.session.code) {
        const code = Math.floor(Math.random() * 1e6)
          .toString()
          .padEnd(4, '0');
        ctx.session.code = code;
        return `Send code '${code}' for auth`;
      } else if (ctx.session.code !== (ctx as MessageContext).text) {
        return 'Wrong code! Try now';
      }

      ctx.session.isAuth = true;
      return 'Success authorized!';
    }

    // and next (hearMiddleware, ...)
    await next();
  }
}
