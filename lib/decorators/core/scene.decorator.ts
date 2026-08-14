import { SetMetadata } from '@nestjs/common';

export const VK_SCENE_METADATA = 'VK_SCENE_METADATA';

/**
 * TODO
 */
export const VkScene = (id: string): ClassDecorator =>
  SetMetadata(VK_SCENE_METADATA, id);
VkScene.KEY = VK_SCENE_METADATA;

/**
 * Alias for {@link VkScene}
 */
export const Scene = VkScene;
