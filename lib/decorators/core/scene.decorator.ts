import { SetMetadata } from '@nestjs/common';
import { VK_SCENE_METADATA } from '../../vk.constants';

/**
 * TODO
 */
export const Scene = (id: string): ClassDecorator => SetMetadata(VK_SCENE_METADATA, id);
