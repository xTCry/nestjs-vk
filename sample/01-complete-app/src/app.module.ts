import { Global, Logger, Module, OnModuleInit } from '@nestjs/common';
import { InjectVkApi, VkModule } from 'nestjs-vk';
import { VK } from 'vk-io';

import { EchoModule } from './echo/echo.module';
import { FeaturesMiddleware } from './middleware/features.middleware';

const middlewares = [FeaturesMiddleware];

@Global()
@Module({
  imports: [
    VkModule.forManagers({
      // useSessionManager: false,
      useSceneManager: false,
      // useHearManager: false,
    }),
    VkModule.forRootAsync({
      useFactory: async (featuresMiddleware: FeaturesMiddleware) => ({
        token: process.env.BOT_TOKEN,
        options: {
          pollingGroupId: +process.env.BOT_GROUP_ID,
          apiMode: 'sequential',
        },
        launchOptions: false,
        notReplyMessage: true,
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
  private readonly logger = new Logger(AppModule.name);

  constructor(
    @InjectVkApi()
    private readonly vk: VK,
  ) {}

  async onModuleInit() {
    this.vk.updates
      .start()
      .then(() => this.logger.log('[Bot] Started'))
      .catch((err) => this.logger.error(err));
  }
}
