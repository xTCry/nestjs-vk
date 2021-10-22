import { VK } from 'vk-io';
import { VkModuleOptions } from '../interfaces';

export async function createBotFactory(options: VkModuleOptions): Promise<VK> {
  const bot = new VK({ token: options.token, ...options.options });

  if (options.launchOptions !== false) {
    await bot.updates.start(options.launchOptions);
  }

  return bot;
}
