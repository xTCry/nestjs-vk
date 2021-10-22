import { SetMetadata } from '@nestjs/common';
import { UPDATE_METADATA } from '../../vk.constants';

/**
 * `@Update` decorator, it's like NestJS `@Controller` decorator,
 * but for VK-IO Bot API updates.
 */
export const Update = (): ClassDecorator => SetMetadata(UPDATE_METADATA, true);
