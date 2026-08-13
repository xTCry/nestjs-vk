import { Module } from '@nestjs/common';

import { BotSecondUpdate } from './bot-second.update';

@Module({
  providers: [BotSecondUpdate],
})
export class BotSecondModule {}
