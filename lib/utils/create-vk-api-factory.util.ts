import { VK } from 'vk-io';
import { VkModuleOptions } from '../interfaces';

export async function createVkApiFactory(options: VkModuleOptions): Promise<VK> {
  const vk = new VK({ token: options.token, ...options.options });

  if (options.launchOptions !== false) {
    await vk.updates.start(options.launchOptions);
  }

  return vk;
}
