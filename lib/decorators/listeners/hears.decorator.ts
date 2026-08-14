import { ListenerDecorator } from '../../utils';

export const VkHears = ListenerDecorator('hears');
export const VkHearFallback = ListenerDecorator('hears', 'onFallback');

/**
 * Alias for {@link VkHears}
 */
export const Hears = VkHears;

/**
 * Alias for {@link VkHearFallback}
 */
export const HearFallback = VkHearFallback;
