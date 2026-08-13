import { Module } from '@nestjs/common';
import { VkModule } from 'nestjs-vk';

import { BotPartialModule } from './bot-partial/bot-partial.module';
import { BotSecondModule } from './bot-second/bot-second.module';

@Module({
  imports: [
    // VkModule.forManagers({ useSceneManager: false }, 'secondBot'),
    VkModule.forRootAsync({
      vkName: 'firstBot',
      useFactory: async () => ({
        token: process.env.BOT_TOKEN_1,
        options: {
          pollingGroupId: +process.env.BOT_GROUP_ID_1,
          apiMode: 'sequential',
        },
        notReplyMessage: true,
        // BotPartialModule providers and scenes are registered for firstBot.
        include: [BotPartialModule],
      }),
    }),
    VkModule.forRootAsync({
      vkName: 'secondBot',
      useFactory: async () => ({
        token: process.env.BOT_TOKEN_2,
        options: {
          pollingGroupId: +process.env.BOT_GROUP_ID_2,
          apiMode: 'sequential',
        },
        notReplyMessage: true,
        // BotPartialModule is shared, BotSecondModule is registered only for secondBot.
        include: [BotPartialModule, BotSecondModule],
      }),
    }),
    BotPartialModule,
    BotSecondModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
