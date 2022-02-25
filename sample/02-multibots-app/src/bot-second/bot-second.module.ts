import { Module } from '@nestjs/common';
import { BotSecondlUpdate } from './bot-second.update';

@Module({
  providers: [BotSecondlUpdate],
})
export class BotSecondlModule {}
