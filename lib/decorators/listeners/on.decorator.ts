import { Context, ContextTypes, ContextSubTypes } from 'vk-io';
import { Middleware } from 'middleware-io';
import { createListenerDecorator } from '../../utils';

export const On = createListenerDecorator<ContextTypes | ContextSubTypes, Middleware<Context>>('vk_updates', 'on');
