# NestJS VK

[![npm](https://img.shields.io/npm/v/nestjs-vk.svg?style=flat-square)](https://www.npmjs.com/package/nestjs-vk)
[![NPM](https://img.shields.io/npm/dt/nestjs-vk.svg?style=flat-square)](https://www.npmjs.com/package/nestjs-vk)
[![GitHub last commit](https://img.shields.io/github/last-commit/xtcry/nestjs-vk)](https://github.com/xtcry/nestjs-vk)

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

```bash
$ npm i nestjs-vk vk-io
```

## Usage

Once the installation process is complete, we can import the `VkModule` into the root `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { VkModule } from 'nestjs-vk';

import { AppUpdate } from './app.update';
import { SimpleScene } from './scene/simple.scene';

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
  providers: [AppUpdate, SimpleScene],
})
export class AppModule {}
```

Then create `app.update.ts` file and add some decorators for handling VK bot API updates:

```typescript
import { InjectVkApi, Update, Ctx, Message, Hears, HearFallback } from 'nestjs-vk';
import { MessageContext, VK } from 'vk-io';

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

  @Hears(/scene( ?(?<state>[0-9]+))?$/i)
  async hearsScene(@Ctx() ctx: MessageContext) {
    const stateNumber = ((e) => (isNaN(Number(e)) ? null : Number(e)))(ctx.$match?.groups?.state);
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

For a simple scene, let's create an `simple.scene.ts` file and do a few steps for it:

```typescript
import { Scene, AddStep, Ctx, SceneEnter, SceneLeave } from 'nestjs-vk';
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
