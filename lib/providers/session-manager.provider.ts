import { Provider } from '@nestjs/common';
import { SessionManager } from '@vk-io/session';
import { VkModuleOptions } from '../interfaces';
import { VK_MODULE_OPTIONS, VK_SESSION_MANAGER } from '../vk.constants';

export const sessionManagerProvider: Provider = {
  provide: VK_SESSION_MANAGER,
  useFactory: (vkOptions: VkModuleOptions) =>
    vkOptions.useSessionManager instanceof SessionManager ? vkOptions.useSessionManager : new SessionManager(),
  inject: [VK_MODULE_OPTIONS],
};
