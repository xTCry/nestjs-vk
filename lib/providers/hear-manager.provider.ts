import { Provider } from '@nestjs/common';
import { HearManager } from '@vk-io/hear';

import { VkManagersOptions } from '../interfaces';
import { getVkHearManagerToken, getVkManagersOptionsToken } from '../utils';
import { VK_HEAR_MANAGER } from '../vk.constants';

export const createHearManagerProvider = (vkName?: string): Provider => ({
  provide: getVkHearManagerToken(vkName),
  useFactory: (options?: VkManagersOptions) =>
    options?.useHearManager instanceof HearManager
      ? options.useHearManager
      : new HearManager(),
  inject: [{ token: getVkManagersOptionsToken(vkName), optional: true }],
});

export const hearManagerProvider: Provider = createHearManagerProvider();

export const createLegacyHearManagerProvider = (vkName?: string): Provider => ({
  provide: VK_HEAR_MANAGER,
  useExisting: getVkHearManagerToken(vkName),
});
