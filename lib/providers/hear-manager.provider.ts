import { Provider } from '@nestjs/common';
import { HearManager } from '@vk-io/hear';
import { VK_HEAR_MANAGER } from '../vk.constants';

export const hearManagerProvider: Provider = {
  provide: VK_HEAR_MANAGER,
  useClass: HearManager,
};
