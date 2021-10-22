import { HearConditions } from '@vk-io/hear';
import { createListenerDecorator } from '../../utils';

export const Hears = createListenerDecorator<HearConditions<any>>('hears');
export const HearFallback = createListenerDecorator<never, never>('hears', 'onFallback');
