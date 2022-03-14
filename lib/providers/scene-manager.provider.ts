import { Provider } from '@nestjs/common';
import { SceneManager } from '@vk-io/scenes';
import { VkModuleOptions } from '../interfaces';
import { VK_MODULE_OPTIONS, VK_SCENE_MANAGER } from '../vk.constants';

export const sceneManagerProvider: Provider = {
  provide: VK_SCENE_MANAGER,
  useFactory: (vkOptions: VkModuleOptions) =>
    vkOptions.useSceneManager instanceof SceneManager ? vkOptions.useSceneManager : new SceneManager(),
  inject: [VK_MODULE_OPTIONS],
};
