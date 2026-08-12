import type { MessageEventContext } from 'vk-io';

import { createListenerDecorator } from '../../utils';

/** Payload callback-события VK `message_event`. */
export interface MessageEventPayload {
  [key: string]: MessageEventPayloadValue;
}

/** Условие одного поля payload callback-события VK. */
export type MessageEventPayloadValue =
  | string
  | number
  | boolean
  | null
  | RegExp
  | MessageEventPayload;

/** Условие, которому должен удовлетворять payload callback-события VK. */
export type MessageEventCondition =
  | Record<string, MessageEventPayloadValue>
  | ((payload: MessageEventPayload, context: MessageEventContext) => boolean);

/** Обрабатывает `message_event` и, при наличии условия, фильтрует event payload. */
export const OnMessageEvent =
  createListenerDecorator<MessageEventCondition>('message_event');
