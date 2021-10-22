import { Provider } from '@nestjs/common';
import { SessionManager } from '@vk-io/session';
import { VK_SESSION_MANAGER } from '../vk.constants';

export const sessionManagerProvider: Provider = {
  provide: VK_SESSION_MANAGER,
  useClass: SessionManager,
};
