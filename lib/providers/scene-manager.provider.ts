import { Provider } from '@nestjs/common';
import { SceneManager } from '@vk-io/scenes';
import { VK_SCENE_MANAGER } from '../vk.constants';

export const sceneManagerProvider: Provider = {
  provide: VK_SCENE_MANAGER,
  useClass: SceneManager,
};
