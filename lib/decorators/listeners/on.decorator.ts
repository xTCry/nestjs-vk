import { Middleware } from 'middleware-io';
import { Context, ContextSubTypes, ContextTypes } from 'vk-io';

import { createListenerDecorator } from '../../utils';

export const On = createListenerDecorator<
  ContextTypes | ContextSubTypes,
  Middleware<Context>
>('vk_updates', 'on');
