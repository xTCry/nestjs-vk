import { SetMetadata } from '@nestjs/common';
import { VK_SCENE_STEP_METADATA } from '../../vk.constants';

export const AddStep = (step?: number) => SetMetadata<string>(VK_SCENE_STEP_METADATA, step ?? true);
