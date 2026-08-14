import { SetMetadata } from '@nestjs/common';

export const VK_UPDATE_METADATA = 'VK_UPDATE_METADATA';

/**
 * `@VkUpdate` decorator, it's like NestJS `@Controller` decorator,
 * but for VK-IO Bot API updates.
 */
export const VkUpdate = () => SetMetadata(VK_UPDATE_METADATA, true);
VkUpdate.KEY = VK_UPDATE_METADATA;

/**
 * Alias for {@link VkUpdate}
 */
export const Update = VkUpdate;
