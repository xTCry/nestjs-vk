import { Provider } from '@nestjs/common';
import { SessionManager } from '@vk-io/session';
import { VkManagersOptions } from '../interfaces';
import { VK_MANAGERS_OPTIONS, VK_SESSION_MANAGER } from '../vk.constants';

export const sessionManagerProvider: Provider = {
  provide: VK_SESSION_MANAGER,
  useFactory: (options: VkManagersOptions) =>
    options.useSessionManager instanceof SessionManager ? options.useSessionManager : new SessionManager(),
  inject: [VK_MANAGERS_OPTIONS],
};
