import { Provider } from '@nestjs/common';
import { HearManager } from '@vk-io/hear';
import { VkModuleOptions } from '../interfaces';
import { VK_HEAR_MANAGER, VK_MODULE_OPTIONS } from '../vk.constants';

export const hearManagerProvider: Provider = {
  provide: VK_HEAR_MANAGER,
  useFactory: (vkOptions: VkModuleOptions) =>
    vkOptions.useHearManager instanceof HearManager ? vkOptions.useHearManager : new HearManager(),
  inject: [VK_MODULE_OPTIONS],
};
