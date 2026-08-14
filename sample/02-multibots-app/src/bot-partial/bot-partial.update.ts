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

// * Set listeners for all bots
@Update()
@UseFilters(VkExceptionFilter)
export class BotPartialUpdate {
  constructor(
    @InjectVkApi('firstBot')
    private readonly firstBot: VK,
    @InjectVkApi('secondBot')
    private readonly secondBot: VK,

    @InjectVkHearManager('firstBot')
    private readonly firstBotHearManager: HearManager<MessageContext>,
    @InjectVkSessionManager('firstBot')
    private readonly firstBotSessionManager: SessionManager,
    @InjectVkSceneManager('firstBot')
    private readonly firstBotSceneManager: SceneManager,
    //
    @InjectVkHearManager('secondBot')
    private readonly secondBotHearManager: HearManager<MessageContext>,
  ) {
    // * Custom hear handlers registered only in firstBot HearManager
    this.firstBotHearManager
      .hear('qq', (ctx) => {
        ctx.send('HelloW');
      })
      .hear('ww', (ctx) => {
        return ctx.scene.enter('signup');
      })
      .hear('ff', (ctx) => {
        return ctx.scene.enter('BEST_SCEN');
      });

    // Custom hear handler registered only in secondBot HearManager.
    this.secondBotHearManager
      .hear('ww2', (ctx) => {
        // * Error: Value by signup not found
        return ctx.scene.enter('signup');
      })
      .hear('ff2', (ctx) => {
        // * Scene exists
        return ctx.scene?.enter('BEST_SCEN');
        // ! Not workd when `VkModule.forManagers({ useSceneManager: false }, 'secondBot')` in AppModule
      });

    console.log('secondBotHearManager.length', secondBotHearManager.length);

    // This scene is registered only in firstBot SceneManager.
    // `BEST_SCEN` is declared with @Scene() in BotPartialModule and is available
    // for every bot that includes BotPartialModule.
    this.firstBotSceneManager.addScenes([
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
  async onMessageFirst(
    @Ctx() ctx: MessageContext,
    @Next() next: NextMiddleware,
  ) {
    if (ctx.is(['message'])) {
      // Skip messages
      if (ctx.isOutbox || ctx.isGroup) {
        return;
      }
    }

    console.log(
      'OnMessage',
      '| $groupId:',
      ctx.$groupId,
      '| peerId:',
      ctx.peerId,
      '| senderId:',
      ctx.senderId,
      '| Text len:',
      ctx.text?.length,
    );

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
    • firstBotHearManager.length: ${this.firstBotHearManager.length}
    • firstBotSessionManager: ${JSON.stringify(
      this.firstBotSessionManager,
    ).slice(0, 150)}
    `;
    return message;
  }

  @Hears(/^\/?(start|старт)$/i)
  async onStartCommand(@Next() next: NextMiddleware) {
    /* for test */ next(); // to onHearFallback
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
  async onMessageAuth(
    @Ctx() ctx: MessageContext,
    @Next() next: NextMiddleware,
  ) {
    const authRequired = false; // disabled for test

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
