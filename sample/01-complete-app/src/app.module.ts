import { Global, Module, OnModuleInit } from '@nestjs/common';
import { InjectVkBot, VkModule } from '../../../';
import { VK } from 'vk-io';

import { FeaturesMiddleware } from './middleware/features.middleware';

import { EchoModule } from './echo/echo.module';

const middlewares = [FeaturesMiddleware];

@Global()
@Module({
  imports: [
    VkModule.forRootAsync({
      useFactory: async (featuresMiddleware: FeaturesMiddleware) => ({
        token: process.env.BOT_TOKEN,
        options: {
          pollingGroupId: +process.env.BOT_GROUP_ID,
          apiMode: 'sequential',
        },
        // useSessionManager: false,
        // useHearManager: false,
        launchOptions: false,
        notRelpyMessage: true,
        middlewaresBefore: [featuresMiddleware.middleware],
        include: [EchoModule],
      }),
      inject: [FeaturesMiddleware],
    }),
    EchoModule,
  ],
  providers: [...middlewares],
  exports: [...middlewares],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectVkBot()
    private readonly bot: VK,
  ) {}

  async onModuleInit() {
    try {
      await this.bot.updates.start();
    } catch (err) {
      console.error(err);
    }
  }
}
