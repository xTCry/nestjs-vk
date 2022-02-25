import { SetMetadata } from '@nestjs/common';
import { VK_SCENE_ACTION_METADATA } from '../../vk.constants';

export const SceneLeave = () => SetMetadata(VK_SCENE_ACTION_METADATA, 'leave');
