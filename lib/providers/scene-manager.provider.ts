import { Provider } from '@nestjs/common';
import { SceneManager } from '@vk-io/scenes';
import { VkManagersOptions } from '../interfaces';
import { VK_MANAGERS_OPTIONS, VK_SCENE_MANAGER } from '../vk.constants';

export const sceneManagerProvider: Provider = {
  provide: VK_SCENE_MANAGER,
  useFactory: (options: VkManagersOptions) =>
    options.useSceneManager instanceof SceneManager ? options.useSceneManager : new SceneManager(),
  inject: [VK_MANAGERS_OPTIONS],
};
