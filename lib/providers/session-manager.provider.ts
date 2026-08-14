import { Provider } from '@nestjs/common';
import { SessionManager } from '@vk-io/session';

import { VkManagersOptions } from '../interfaces';
import { getVkManagersOptionsToken, getVkSessionManagerToken } from '../utils';
import { VK_SESSION_MANAGER } from '../vk.constants';

export const createSessionManagerProvider = (vkName?: string): Provider => ({
  provide: getVkSessionManagerToken(vkName),
  useFactory: (options?: VkManagersOptions) =>
    options?.useSessionManager instanceof SessionManager
      ? options.useSessionManager
      : new SessionManager(),
  inject: [{ token: getVkManagersOptionsToken(vkName), optional: true }],
});

export const sessionManagerProvider: Provider = createSessionManagerProvider();

export const createLegacySessionManagerProvider = (
  vkName?: string,
): Provider => ({
  provide: VK_SESSION_MANAGER,
  useExisting: getVkSessionManagerToken(vkName),
});
