import { SetMetadata } from '@nestjs/common';
import { VK_UPDATE_METADATA } from '../../vk.constants';

/**
 * `@Update` decorator, it's like NestJS `@Controller` decorator,
 * but for VK-IO Bot API updates.
 */
export const Update = (): ClassDecorator => SetMetadata(VK_UPDATE_METADATA, true);
