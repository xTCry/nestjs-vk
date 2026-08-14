# NestJS VK

[![npm](https://img.shields.io/npm/v/nestjs-vk.svg?style=flat-square)](https://www.npmjs.com/package/nestjs-vk)
[![NPM](https://img.shields.io/npm/dt/nestjs-vk.svg?style=flat-square)](https://www.npmjs.com/package/nestjs-vk)
[![GitHub last commit](https://img.shields.io/github/last-commit/xtcry/nestjs-vk)](https://github.com/xtcry/nestjs-vk)

[Документация на русском](./README.md)

<img src="https://nestjs.com/img/logo-small.svg" title="NestJS logotype" align="right" width="95" height="148">

**NestJS VK** – powerful solution for creating VK bots.

This package uses the best of the NodeJS world under the hood. [VK-IO](https://github.com/negezor/vk-io) is a powerful Node.js module that allows you to easily interact with the VK API and for creating bots, and [NestJS](https://github.com/nestjs) is a progressive framework for creating well-architectured applications.

This module provides a quick and easy way to interact with the VK API and create VK bots and deep integration with your NestJS application.

**Features**

- Simple. Easy to use.
- Ability to create custom decorators.
- Scenes support.
- Ability to run multiple bots simultaneously.
- Full support of NestJS guards, interceptors, filters and pipes!

## Installation

#### NPM

```bash
$ npm i nestjs-vk vk-io
```

#### Yarn

```bash
$ yarn add nestjs-vk vk-io
```

## Usage

Once the installation process is complete, import `VkModule` into the root
`AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { VkModule } from 'nestjs-vk';

import { AppUpdate } from './app.update';

@Module({
  imports: [
    VkModule.forRoot({
      token: process.env.VK_BOT_TOKEN,
      options: {
        pollingGroupId: +process.env.VK_BOT_GROUP_ID,
        apiMode: 'sequential',
      },
    }),
  ],
  providers: [AppUpdate],
})
export class AppModule {}
```

Create `app.update.ts`:

```typescript
import { Ctx, Hears, Update } from 'nestjs-vk';
import { MessageContext } from 'vk-io';

@Update()
export class AppUpdate {
  @Hears(/^\/?(start)$/i)
  async onStartCommand(@Ctx() ctx: MessageContext) {
    await ctx.reply('Welcome');
  }
}
```

For callback buttons, use `OnMessageEvent`:

```typescript
import { Ctx, OnMessageEvent, Update } from 'nestjs-vk';
import { MessageEventContext } from 'vk-io';

@Update()
export class AppUpdate {
  @OnMessageEvent({ action: 'open_queue' })
  async onOpenQueue(@Ctx() ctx: MessageEventContext) {
    await ctx.answer({ type: 'show_snackbar', text: 'Queue opened' });
  }
}
```

<details>
<summary>Configuring managers with <code>VkModule.forManagers()</code></summary>

`VkModule.forManagers()` is not required for the default setup. Without it,
`nestjs-vk` creates and registers `SessionManager`, `SceneManager` and
`HearManager` automatically.

Use `VkModule.forManagers()` only when you need to:

- disable one of the default managers;
- disable all default managers with a single `false` value;
- pass your own manager instance;
- disable automatic manager middleware registration and attach it manually in
  `middlewaresBefore` / `middlewaresAfter`;
- apply these settings to a specific `vkName`.

To disable `SessionManager`, `SceneManager` and `HearManager` at once:

```typescript
VkModule.forManagers(false);
```

For multiple bots, configure managers for a specific bot by passing `vkName` as
the second argument:

```typescript
VkModule.forManagers(
  {
    useSceneManager: false,
  },
  'firstBot',
);
```

For a named bot, it works the same way:

```typescript
VkModule.forManagers(false, 'firstBot');
```

`forManagers()` does not create a second manager instance on top of `forRoot()`.
It provides options that `forRoot()` / `forRootAsync()` use when creating and
attaching managers for that bot. Therefore `@InjectVkHearManager('firstBot')`
and internal `@Hears()` registration use the same `HearManager`.

An empty `VkModule.forManagers({}, 'firstBot')` call is usually unnecessary: it
is equivalent to the default behavior. Use it only when you want to make it
explicit that this bot keeps default manager settings.

If `useSceneManager: false` is set, the module will not attach
`SceneManager.middleware` and `SceneManager.middlewareIntercept` for that bot.
In this mode, `ctx.scene.enter(...)` and current scene processing will not work
for that bot until you attach scene middleware manually.

</details>

<details>
<summary>Advanced module setup, middleware and manager providers</summary>

Example `AppModule` with `forRootAsync()` and manual middleware order:

```typescript
import { Module } from '@nestjs/common';
import { VkModule } from 'nestjs-vk';

import { AppUpdate } from './app.update';
import { MainMiddleware } from './main.middleware';
import { SimpleScene } from './scene/simple.scene';

@Module({
  imports: [
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
  ],
  providers: [MainMiddleware, AppUpdate, SimpleScene],
  exports: [MainMiddleware],
})
export class AppModule {}
```

Main middleware `main.middleware.ts`:

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

Manager providers can be injected in constructors:

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

</details>

<details>
<summary>Multi-bot and <code>vkName</code></summary>

A complete multi-bot application example is available in
[`sample/02-multibots-app`](./sample/02-multibots-app).

In multi-bot applications, pass `vkName` to inject decorators to get the manager
for a specific bot:

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

The same `vkName` is used internally by `VkModule.forRoot()` /
`VkModule.forRootAsync()` and `VkModule.forManagers()`, so manager options,
`include` and VK API shutdown are applied to a specific bot instead of a shared
default provider.

Important: `vkName` in inject decorators must match the `vkName` passed to
`VkModule.forRoot()` / `VkModule.forRootAsync()`. `@Update()` itself does not
select a bot — an update provider is attached to a bot through `include`.

```typescript
VkModule.forRootAsync({
  vkName: 'firstBot',
  include: [CommonBotModule],
});

VkModule.forRootAsync({
  vkName: 'secondBot',
  include: [CommonBotModule, SecondBotModule],
});
```

In this example, update providers from `CommonBotModule` are registered in both
bots, while update providers from `SecondBotModule` are registered only in the
second bot.

</details>

<details>
<summary>Advanced update provider example</summary>

Example `app.update.ts` with several listener types:

```typescript
import {
  Ctx,
  HearFallback,
  Hears,
  InjectVkApi,
  Message,
  MessageEventContextWithMatch,
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
    await ctx.reply('Welcome');
  }

  @Hears('hi')
  async hearsHi(@Ctx() ctx: MessageContext) {
    return 'Hey there';
  }

  @OnMessageEvent({ broadcastAction: 'queue' })
  async onQueueAction(@Ctx() ctx: MessageEventContext) {
    await ctx.answer({ type: 'show_snackbar', text: 'Queue opened' });
  }

  @OnMessageEvent(/^request_auth:(?<code>.*):(?<state>.*)/)
  async onRequestAuth(@Ctx() ctx: MessageEventContextWithMatch) {
    const { code, state } = ctx.$match?.groups ?? {};

    if (!code || !state) {
      return;
    }

    await ctx.answer({ type: 'show_snackbar', text: 'Authorization received' });
  }

  @OnMessageEvent(
    (payload) =>
      payload?.phrase === 'schedule-notification' ||
      Boolean(payload?.scheduleNotifAction),
  )
  async onScheduleNotification(@Ctx() ctx: MessageEventContext) {
    await ctx.answer({ type: 'show_snackbar', text: 'Notifications opened' });
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
    return isSib ? 'So good!' : 'No sub';
  }

  @HearFallback()
  onHearFallback(@Ctx() ctx: MessageContext, @Message('text') text: string) {
    if (text) {
      return this.appService.echo(text);
    } else if (ctx.hasAttachments('sticker')) {
      ctx.send({ sticker_id: ctx.getAttachments('sticker')[0].id % 24 });
      return;
    }

    return 'What?..';
  }
}
```

`OnMessageEvent` registers a callback event handler for `message_event`.
Object conditions are matched against `ctx.eventPayload`, and predicates
receive the payload as the first argument.

For string `ctx.eventPayload`, you can pass a string or `RegExp`. The condition
is checked through `String.match()`, and the match result is stored in
`ctx.$match`, the same way as with `Hears`. This allows using named groups in
the handler.

If the condition does not match, the handler passes control to the next listener,
so guards and the method are not called.

</details>

<details>
<summary>Registration and execution order</summary>

`@Update()` only marks a class as an update provider. A class is attached to a
specific bot through `include` in `VkModule.forRoot()` /
`VkModule.forRootAsync()`.

During `onModuleInit`, middleware is attached in this order:

1. `middlewaresBefore`;
2. `SessionManager.middleware`, if `useSessionManager !== false`;
3. `SceneManager.middleware` and `SceneManager.middlewareIntercept`, if
   `useSceneManager !== false`;
4. listeners from `@Use()`, `@On()` and `@OnMessageEvent()`;
5. scenes from `@Scene()`;
6. `HearManager.middleware`, if `useHearManager !== false`;
7. `middlewaresAfter`.

Practically, this means:

- `@On()` / `@OnMessageEvent()` listeners are registered on `vk.updates` before
  `HearManager.middleware` is attached, so they run before `@Hears()`;
- method order for `@On()` inside a class should not be used as business logic;
  if a listener should pass the event further, call `next()` explicitly;
- `@Hears()` order matters because handlers are added to `HearManager` in the
  order providers and methods are scanned;
- `@HearFallback()` is called by `HearManager` when no matching `@Hears()`
  handles the event;
- `@AddStep()` without an argument receives an index based on method scan order,
  while `@AddStep(10)` / `@AddStep(20)` define explicit scene step order;
- `include` order does not sort modules: it only filters which modules are
  scanned. The actual module/provider order comes from the Nest container.

If order is critical, define it explicitly with `middlewaresBefore` /
`middlewaresAfter`, explicit `@AddStep(step)` numbers, or a single coordinating
listener that calls `next()` itself.

</details>

<details>
<summary>Scene example</summary>

For a simple scene, let's create an `simple.scene.ts` file and do a few steps for it:

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
      `Hello! I am a simple scene. Your state number is ${stateNumber}.\n` +
        ` You can send me a number and I will multiply it by 2.`,
    );
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: IStepContext) {
    await ctx.reply('Bye!');
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
      await ctx.reply('Please send me a number.');
      return;
    }

    if (isNaN(number)) {
      await ctx.reply('Wrong. Please send me a number.');
      return;
    }

    await ctx.reply(`Your number multiplied by 2 is ${number * 2}.`);

    if (number > 20 && number % 2 === 0) {
      await ctx.scene.leave();
    }
  }
}
```

</details>
