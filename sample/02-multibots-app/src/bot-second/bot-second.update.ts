import { UseFilters } from '@nestjs/common';
import {
  Ctx,
  Hears,
  InjectVkHearManager,
  InjectVkSessionManager,
  Update,
} from 'nestjs-vk';
import { MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SessionManager } from '@vk-io/session';

import { VkExceptionFilter } from '../common';

@Update()
@UseFilters(VkExceptionFilter)
export class BotSecondUpdate {
  constructor(
    @InjectVkHearManager('secondBot')
    private readonly secondBotHearManager: HearManager<MessageContext>,
    @InjectVkSessionManager('secondBot')
    private readonly secondBotSessionManager: SessionManager,
  ) {
    this.secondBotHearManager.hear('wow', (ctx) => {
      ctx.send('Wohoh');
    });

    console.log('[BotSecondUpdate] ctr', this.secondBotHearManager.length);
  }

  @Hears('/second')
  onSecondCommand(@Ctx() ctx: MessageContext) {
    ctx.send({ sticker_id: 2 });
  }

  @Hears('/info2')
  onInfoCommand() {
    const message = `
    Info2:
    • secondBotHearManager.length: ${this.secondBotHearManager.length}
    • secondBotSessionManager: ${JSON.stringify(
      this.secondBotSessionManager,
    ).slice(0, 150)}
    `;
    return message;
  }
}
