# NestJS VK

[![npm](https://img.shields.io/npm/v/nestjs-vk.svg?style=flat-square)](https://www.npmjs.com/package/nestjs-vk)
[![NPM](https://img.shields.io/npm/dt/nestjs-vk.svg?style=flat-square)](https://www.npmjs.com/package/nestjs-vk)
[![GitHub last commit](https://img.shields.io/github/last-commit/xtcry/nestjs-vk)](https://github.com/xtcry/nestjs-vk)

[English documentation](./README.en.md)

<img src="https://nestjs.com/img/logo-small.svg" title="NestJS logotype" align="right" width="95" height="148">

**NestJS VK** — модуль для создания VK-ботов на NestJS.

Пакет использует [VK-IO](https://github.com/negezor/vk-io) для работы с VK API
и [NestJS](https://github.com/nestjs) для интеграции бота в архитектуру
приложения.

Модуль помогает подключить VK API, обработчики событий, middleware, guards,
interceptors, filters, pipes, hears-обработчики и scenes в NestJS-приложении.

**Возможности**

- Простое подключение VK-бота в NestJS.
- Поддержка собственных декораторов.
- Поддержка scenes.
- Запуск нескольких ботов одновременно.
- Поддержка NestJS guards, interceptors, filters и pipes.

## Установка

#### NPM

```bash
$ npm i nestjs-vk vk-io
```

#### Yarn

```bash
$ yarn add nestjs-vk vk-io
```

## Использование

После установки импортируйте `VkModule` в корневой `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { VkModule } from 'nestjs-vk';

import { AppUpdate } from './app.update';
import { SimpleScene } from './scene/simple.scene';

@Module({
  imports: [
    // Необязательно. Используйте только если нужно отключить managers,
    // передать свои экземпляры managers или вручную управлять порядком middleware.
    VkModule.forManagers({
      useSessionManager: false,
      useSceneManager: false,
      useHearManager: false,
    }),
    VkModule.forRootAsync({
      inject: [MainMiddleware],
      useFactory: async (mainMiddleware: MainMiddleware) => ({
        token: process.env.VK_BOT_TOKEN,
        options: {
          pollingGroupId: +process.env.VK_BOT_GROUP_ID,
          apiMode: 'sequential',
        },
        // launchOptions: false,
        // notReplyMessage: true,
        middlewaresBefore: [mainMiddleware.middlewaresBefore],
        middlewaresAfter: [mainMiddleware.middlewaresAfter],
      }),
    }),
    // VkModule.forRoot({
    //   token: process.env.VK_BOT_TOKEN,
    //   options: {
    //     pollingGroupId: +process.env.VK_BOT_GROUP_ID,
    //     apiMode: 'sequential',
    //   },
    // }),
  ],
  providers: [MainMiddleware, AppUpdate, SimpleScene],
  exports: [MainMiddleware],
})
export class AppModule {}
```

`VkModule.forManagers()` не обязателен для стандартного запуска. Без него
`nestjs-vk` автоматически создаёт и регистрирует `SessionManager`,
`SceneManager` и `HearManager`.

Используйте `VkModule.forManagers()` только если нужно:

- отключить один из default managers;
- передать собственный экземпляр manager;
- перенести manager middleware в `middlewaresBefore` / `middlewaresAfter`;
- переиспользовать явно настроенные managers через DI.

Для нескольких ботов можно настроить managers конкретного бота через второй
аргумент `vkName`:

```typescript
VkModule.forManagers(
  {
    useSceneManager: false,
  },
  'firstBot',
);
```

Основной middleware `main.middleware.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectVkHearManager, InjectVkSceneManager } from 'nestjs-vk';
import { Composer, Context, MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SceneManager } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

@Injectable()
export class MainMiddleware {
  private readonly sessionManager: SessionManager;

  @InjectVkHearManager()
  private readonly hearManagerProvider: HearManager<MessageContext>;

  @InjectVkSceneManager()
  private readonly sceneManager: SceneManager;

  constructor() {
    this.sessionManager = new SessionManager({
      // ...
    });
  }

  get middlewaresBefore() {
    const composer = Composer.builder<Context>();

    composer.use(this.sessionManager.middleware);
    composer.use(this.sceneManager.middleware);

    return composer.compose();
  }

  get middlewaresAfter() {
    const composer = Composer.builder<Context>();

    composer.use(this.hearManagerProvider.middleware);

    return composer.compose();
  }
}
```

Manager providers также можно инжектить в constructor:

```typescript
import {
  InjectVkHearManager,
  InjectVkSceneManager,
  InjectVkSessionManager,
} from 'nestjs-vk';
import { MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SceneManager } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

export class AppUpdate {
  constructor(
    @InjectVkHearManager()
    private readonly hearManager: HearManager<MessageContext>,
    @InjectVkSessionManager()
    private readonly sessionManager: SessionManager,
    @InjectVkSceneManager()
    private readonly sceneManager: SceneManager,
  ) {}
}
```

В multi-bot приложениях передавайте `vkName` в inject decorators, чтобы получить
manager конкретного бота:

```typescript
export class AppUpdate {
  constructor(
    @InjectVkHearManager('firstBot')
    private readonly firstBotHearManager: HearManager<MessageContext>,
    @InjectVkHearManager('secondBot')
    private readonly secondBotHearManager: HearManager<MessageContext>,
  ) {}
}
```

Создайте файл `app.update.ts` и добавьте обработчики событий VK Bot API:

```typescript
import {
  Ctx,
  HearFallback,
  Hears,
  InjectVkApi,
  Message,
  OnMessageEvent,
  Update,
} from 'nestjs-vk';
import { MessageContext, MessageEventContext, VK } from 'vk-io';

import { AppService } from './app.service';
import { SIMPLE_SCENE } from './vk.constants';

@Update()
export class AppUpdate {
  public groupId: number;

  constructor(
    @InjectVkApi()
    private readonly vk: VK,
    private readonly appService: AppService,
  ) {}

  async onModuleInit() {
    try {
      const [group] = await this.vk.api.groups.getById({});
      this.groupId = group.id;
    } catch (err) {
      console.error(err);
    }
  }

  @Hears(/^\/?(start|старт)$/i)
  async onStartCommand(@Ctx() ctx: MessageContext) {
    await ctx.reply('Добро пожаловать');
  }

  @Hears('hi')
  async hearsHi(@Ctx() ctx: MessageContext) {
    return 'Привет';
  }

  @OnMessageEvent({ broadcastAction: 'queue' })
  async onQueueAction(@Ctx() ctx: MessageEventContext) {
    await ctx.answer({ type: 'show_snackbar', text: 'Очередь открыта' });
  }

  @OnMessageEvent(
    (payload) =>
      payload?.phrase === 'schedule-notification' ||
      Boolean(payload?.scheduleNotifAction),
  )
  async onScheduleNotification(@Ctx() ctx: MessageEventContext) {
    await ctx.answer({ type: 'show_snackbar', text: 'Уведомления открыты' });
  }

  @Hears(/scene( ?(?<state>[0-9]+))?$/i)
  async hearsScene(@Ctx() ctx: MessageContext) {
    const stateNumber = ((e) => (isNaN(Number(e)) ? null : Number(e)))(
      ctx.$match?.groups?.state,
    );
    ctx.scene.enter(SIMPLE_SCENE, { state: { stateNumber } });
  }

  @Hears(['/sub', 'subscriber'])
  async onSubscriberCommand(@Ctx() ctx: MessageContext) {
    const isSib = await this.vk.api.groups.isMember({
      group_id: String(this.groupId),
      user_id: ctx.senderId,
    });
    return isSib ? 'Отлично!' : 'Подписка не найдена';
  }

  @HearFallback()
  onHearFallback(@Ctx() ctx: MessageContext, @Message('text') text: string) {
    if (text) {
      return this.appService.echo(text);
    } else if (ctx.hasAttachments('sticker')) {
      ctx.send({ sticker_id: ctx.getAttachments('sticker')[0].id % 24 });
      return;
    }

    return 'Что?..';
  }
}
```

`OnMessageEvent` регистрирует обработчик callback-событий `message_event`.
Объектное условие сопоставляется с `ctx.eventPayload`, а predicate получает
payload первым аргументом. Если условие не подходит, обработчик передаёт
управление следующему listener-у, поэтому guards и метод не вызываются.

Для простой scene создайте файл `simple.scene.ts` и добавьте несколько шагов:

```typescript
import { AddStep, Ctx, Scene, SceneEnter, SceneLeave } from 'nestjs-vk';
import { MessageContext } from 'vk-io';
import { IStepContext } from '@vk-io/scenes';

import { SIMPLE_SCENE } from './vk.constants';

@Scene(SIMPLE_SCENE)
export class SimpleScene {
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: IStepContext) {
    const { stateNumber } = ctx.scene.state;
    await ctx.reply(
      `Привет! Это простая scene. Твой state number: ${stateNumber}.\n` +
        ` Пришли мне число, и я умножу его на 2.`,
    );
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: IStepContext) {
    await ctx.reply('Пока!');
  }

  // @Hears('exit')
  // async onHearsExit(@Ctx() ctx: IStepContext) {
  //   await ctx.scene.leave();
  // }

  @AddStep()
  async onAddStep(@Ctx() ctx: IStepContext) {
    let { stateNumber: number } = ctx.scene.state;

    if (!ctx.scene.step.firstTime) {
      number = Number(ctx.text);
    }

    if (ctx.scene.step.firstTime && number === null) {
      await ctx.reply('Пришли мне число.');
      return;
    }

    if (isNaN(number)) {
      await ctx.reply('Ошибка. Пришли мне число.');
      return;
    }

    await ctx.reply(`Твоё число, умноженное на 2: ${number * 2}.`);

    if (number > 20 && number % 2 === 0) {
      await ctx.scene.leave();
    }
  }
}
```
