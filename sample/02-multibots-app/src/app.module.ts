import { Global, Module } from '@nestjs/common';
import { VkModule } from 'nestjs-vk';

import { BotPartialModule } from './bot-partial/bot-partial.module';
import { BotSecondlModule } from './bot-second/bot-second.module';

@Global()
@Module({
  imports: [
    VkModule.forRootAsync({
      vkName: 'firstBot',
      useFactory: async () => ({
        token: process.env.BOT_TOKEN_1,
        options: {
          pollingGroupId: +process.env.BOT_GROUP_ID_1,
          apiMode: 'sequential',
        },
        notReplyMessage: true,
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
        include: [BotPartialModule, BotSecondlModule],
      }),
    }),
    BotPartialModule,
    BotSecondlModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
