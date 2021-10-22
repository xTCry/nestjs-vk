# NestJS VK
![npm](https://img.shields.io/npm/dm/nestjs-vk)
![GitHub last commit](https://img.shields.io/github/last-commit/xtcry/nestjs-vk)
![NPM](https://img.shields.io/npm/l/nestjs-vk)

<img src="https://nestjs.com/img/logo-small.svg" title="NestJS logotype" align="right" width="95" height="148">

**NestJS VK** – powerful solution for creating VK bots.

This package uses the best of the NodeJS world under the hood. [VK-IO](https://github.com/negezor/vk-io) is a powerful Node.js module that allows you to easily interact with the VK API and for creating bots, and [NestJS](https://github.com/nestjs) is a progressive framework for creating well-architectured applications.

This module provides a quick and easy way to interact with the VK API and create VK bots and deep integration with your NestJS application.

**Features**

- Simple. Easy to use.
- Ability to create custom decorators.
- ~~Scenes support.~~
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

@Module({
  imports: [
    VkModule.forRoot({
      token: process.env.VK_BOT_TOKEN,
      options: {
        pollingGroupId: +process.env.VK_BOT_GROUP_ID,
        apiMode: 'sequential',
      },
    })
  ],
})
export class AppModule {}
```

Then create `app.update.ts` file and add some decorators for handling VK bot API updates:
```typescript
import { InjectVkBot, Update, Ctx, Message, Hears, HearFallback } from 'nestjs-vk';
import { MessageContext, VK } from 'vk-io';
import { AppService } from './app.service';

@Update()
export class AppUpdate {
  public groupId: number;

  constructor(
    @InjectVkBot()
    private readonly bot: VK,
    private readonly appService: AppService,
  ) {}

  async onModuleInit() {
    try {
      const [group] = await this.bot.api.groups.getById({});
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

  @Hears(['/sub', 'subscriber'])
  async onSubscriberCommand(@Ctx() ctx: MessageContext) {
    const isSib = await this.bot.api.groups.isMember({
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
