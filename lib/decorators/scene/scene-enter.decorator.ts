import { SetMetadata } from '@nestjs/common';
import { VK_SCENE_ACTION_METADATA } from '../../vk.constants';

export const SceneEnter = () => SetMetadata(VK_SCENE_ACTION_METADATA, 'enter');
