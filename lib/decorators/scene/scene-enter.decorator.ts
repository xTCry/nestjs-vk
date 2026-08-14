import { SetMetadata } from '@nestjs/common';

export const VK_SCENE_ENTER_METADATA = 'VK_SCENE_ENTER_METADATA';

export const VkSceneEnter = () => SetMetadata(VK_SCENE_ENTER_METADATA, 'enter');
VkSceneEnter.KEY = VK_SCENE_ENTER_METADATA;

/**
 * Alias for {@link VkSceneEnter}
 */
export const SceneEnter = VkSceneEnter;
