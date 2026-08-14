import { Provider } from '@nestjs/common';
import { SceneManager } from '@vk-io/scenes';

import { VkManagersOptions } from '../interfaces';
import { getVkManagersOptionsToken, getVkSceneManagerToken } from '../utils';
import { VK_SCENE_MANAGER } from '../vk.constants';

export const createSceneManagerProvider = (vkName?: string): Provider => ({
  provide: getVkSceneManagerToken(vkName),
  useFactory: (options?: VkManagersOptions) =>
    options?.useSceneManager instanceof SceneManager
      ? options.useSceneManager
      : new SceneManager(),
  inject: [{ token: getVkManagersOptionsToken(vkName), optional: true }],
});

export const sceneManagerProvider: Provider = createSceneManagerProvider();

export const createLegacySceneManagerProvider = (
  vkName?: string,
): Provider => ({
  provide: VK_SCENE_MANAGER,
  useExisting: getVkSceneManagerToken(vkName),
});
