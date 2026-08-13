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
  | string
  | RegExp
  | Record<string, MessageEventPayloadValue>
  | ((payload: MessageEventPayload, ctx: MessageEventContext) => boolean);

/** Контекст `message_event` с результатом сопоставления строкового payload. */
export type MessageEventContextWithMatch = MessageEventContext & {
  $match?: RegExpMatchArray;
};

/** Обрабатывает `message_event` и, при наличии условия, фильтрует event payload. */
export const OnMessageEvent =
  createListenerDecorator<MessageEventCondition>('message_event');
