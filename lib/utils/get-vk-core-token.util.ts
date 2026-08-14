import {
  DEFAULT_VK_API_NAME,
  VK_API_NAME,
  VK_LISTENERS_EXPLORER,
  VK_MODULE_OPTIONS,
  VK_SHUTDOWN_SERVICE,
} from '../vk.constants';

function getVkCoreToken(name: string | undefined, token: string): string {
  return name && name !== DEFAULT_VK_API_NAME ? `${name}${token}` : token;
}

export function getVkModuleOptionsToken(name?: string): string {
  return getVkCoreToken(name, VK_MODULE_OPTIONS);
}

export function getVkApiNameToken(name?: string): string {
  return getVkCoreToken(name, VK_API_NAME);
}

export function getVkListenersExplorerToken(name?: string): string {
  return getVkCoreToken(name, VK_LISTENERS_EXPLORER);
}

export function getVkShutdownServiceToken(name?: string): string {
  return getVkCoreToken(name, VK_SHUTDOWN_SERVICE);
}
