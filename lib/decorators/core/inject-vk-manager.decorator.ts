import { Inject } from '@nestjs/common';

import {
  VK_HEAR_MANAGER,
  VK_SCENE_MANAGER,
  VK_SESSION_MANAGER,
} from '../../vk.constants';

export const InjectVkHearManager = () => Inject(VK_HEAR_MANAGER);

export const InjectVkSessionManager = () => Inject(VK_SESSION_MANAGER);

export const InjectVkSceneManager = () => Inject(VK_SCENE_MANAGER);
