import { ListenerDecorator } from '../../utils';

export const VkOn = ListenerDecorator('vk_updates', 'on');

/**
 * Alias for {@link VkOn}
 */
export const On = VkOn;
