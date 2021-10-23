import { DEFAULT_VK_API_NAME } from '../vk.constants';

export function getVkApiToken(name?: string): string {
  return name && name !== DEFAULT_VK_API_NAME ? `${name}VkApi` : DEFAULT_VK_API_NAME;
}
