import { Provider } from '@nestjs/common';
import { HearManager } from '@vk-io/hear';
import { VkManagersOptions } from '../interfaces';
import { VK_HEAR_MANAGER, VK_MANAGERS_OPTIONS } from '../vk.constants';

export const hearManagerProvider: Provider = {
  provide: VK_HEAR_MANAGER,
  useFactory: (options: VkManagersOptions) =>
    options.useHearManager instanceof HearManager ? options.useHearManager : new HearManager(),
  inject: [VK_MANAGERS_OPTIONS],
};
