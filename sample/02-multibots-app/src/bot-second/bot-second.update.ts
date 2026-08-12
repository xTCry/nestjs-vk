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
export class BotSecondlUpdate {
  constructor(
    @InjectVkHearManager('secondBot')
    private readonly hearManagerProvider_second: HearManager<MessageContext>,
    @InjectVkSessionManager('secondBot')
    private readonly sessionManagerProvider_second: SessionManager,
  ) {
    this.hearManagerProvider_second.hear('wow', (ctx) => {
      ctx.send('Wohoh');
    });

    console.log(
      '[BotSecondlUpdate] ctr',
      this.hearManagerProvider_second.length,
    );
  }

  @Hears('/second')
  onSecondCommand(@Ctx() ctx: MessageContext) {
    ctx.send({ sticker_id: 2 });
  }

  @Hears('/info2')
  onInfoCommand() {
    const message = `
    Info:
    • hearManagerProvider.length: ${this.hearManagerProvider_second.length}
    • sessionManagerProvider.length: ${JSON.stringify(
      this.sessionManagerProvider_second,
    ).slice(0, 150)}
    `;
    return message;
  }
}
