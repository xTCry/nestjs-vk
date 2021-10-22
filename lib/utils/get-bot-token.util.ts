import { DEFAULT_BOT_NAME } from '../vk.constants';

export function getBotToken(name?: string): string {
  return name && name !== DEFAULT_BOT_NAME ? `${name}VkBot` : DEFAULT_BOT_NAME;
}
