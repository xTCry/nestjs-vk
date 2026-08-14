import {
  DEFAULT_VK_API_NAME,
  VK_HEAR_MANAGER,
  VK_MANAGERS_OPTIONS,
  VK_SCENE_MANAGER,
  VK_SESSION_MANAGER,
} from '../vk.constants';

function getVkManagerToken(name: string | undefined, token: string): string {
  return name && name !== DEFAULT_VK_API_NAME ? `${name}${token}` : token;
}

export function getVkManagersOptionsToken(name?: string): string {
  return getVkManagerToken(name, VK_MANAGERS_OPTIONS);
}

export function getVkHearManagerToken(name?: string): string {
  return getVkManagerToken(name, VK_HEAR_MANAGER);
}

export function getVkSessionManagerToken(name?: string): string {
  return getVkManagerToken(name, VK_SESSION_MANAGER);
}

export function getVkSceneManagerToken(name?: string): string {
  return getVkManagerToken(name, VK_SCENE_MANAGER);
}
