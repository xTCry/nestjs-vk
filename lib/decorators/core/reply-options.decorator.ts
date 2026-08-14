import { Reflector } from '@nestjs/core';

import { IVkReplyOptions } from '../../interfaces';

export const VkReplyOptions = Reflector.createDecorator<IVkReplyOptions>({});

/**
 * Alias for {@link VkReplyOptions}
 */
export const ReplyOptions = VkReplyOptions;
