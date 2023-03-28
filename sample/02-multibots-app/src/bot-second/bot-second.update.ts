import { Inject, UseFilters } from '@nestjs/common';
import {
  Update,
  Ctx,
  Hears,
  VK_HEAR_MANAGER,
  VK_SESSION_MANAGER,
} from 'nestjs-vk';
import { MessageContext } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SessionManager } from '@vk-io/session';

import { VkExceptionFilter } from '../common';

@Update()
@UseFilters(VkExceptionFilter)
export class BotSecondlUpdate {
  constructor(
    @Inject(VK_HEAR_MANAGER)
    private readonly hearManagerProvider: HearManager<MessageContext>,
    @Inject(VK_SESSION_MANAGER)
    private readonly sessionManagerProvider: SessionManager,
  ) {
    this.hearManagerProvider.hear('wow', (ctx) => {
      ctx.send('Wohoh');
    });

    console.log('[BotSecondlUpdate] ctr', this.hearManagerProvider.length);
  }

  @Hears('/second')
  onSecondCommand(@Ctx() ctx: MessageContext) {
    ctx.send({ sticker_id: 2 });
  }

  @Hears('/info2')
  onInfoCommand(@Ctx() ctx: MessageContext) {
    const message = `
    Info:
    • hearManagerProvider.length: ${this.hearManagerProvider.length}
    • sessionManagerProvider.length: ${JSON.stringify(
      this.sessionManagerProvider,
    ).slice(0, 150)}
    `;
    return message;
  }
}
