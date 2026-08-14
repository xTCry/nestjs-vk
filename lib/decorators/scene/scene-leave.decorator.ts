import { SetMetadata } from '@nestjs/common';

export const VK_SCENE_LEAVE_METADATA = 'VK_SCENE_LEAVE_METADATA';

export const VkSceneLeave = () => SetMetadata(VK_SCENE_LEAVE_METADATA, 'leave');
VkSceneLeave.KEY = VK_SCENE_LEAVE_METADATA;

/**
 * Alias for {@link VkSceneLeave}
 */
export const SceneLeave = VkSceneLeave;
