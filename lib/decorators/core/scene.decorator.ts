import { SetMetadata } from '@nestjs/common';
import { SCENE_METADATA } from '../../vk.constants';

/**
 * TODO
 */
export const Scene = (id: string): ClassDecorator => SetMetadata(SCENE_METADATA, id);
