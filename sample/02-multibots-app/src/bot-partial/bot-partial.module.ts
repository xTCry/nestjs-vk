import { Module } from '@nestjs/common';

import { BotPartialUpdate } from './bot-partial.update';
import { BestScene } from './scenes/best.scene';

@Module({
  providers: [BotPartialUpdate, BestScene],
})
export class BotPartialModule {}
