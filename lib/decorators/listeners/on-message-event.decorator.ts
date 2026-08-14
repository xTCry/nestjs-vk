import type { MessageEventContext } from 'vk-io';

import type {
  VkMessageEventCondition,
  VkMessageEventPayload,
  VkMessageEventPayloadValue,
} from '../../types';
import { ListenerDecorator } from '../../utils';

/** Payload callback-события VK `message_event`. */
export type MessageEventPayload = VkMessageEventPayload;

/** Условие одного поля payload callback-события VK. */
export type MessageEventPayloadValue = VkMessageEventPayloadValue;

/** Условие, которому должен удовлетворять payload callback-события VK. */
export type MessageEventCondition =
  VkMessageEventCondition<MessageEventPayload>;

/** Контекст `message_event` с результатом сопоставления строкового payload. */
export type MessageEventContextWithMatch = MessageEventContext & {
  $match?: RegExpMatchArray;
};

/** Обрабатывает `message_event` и, при наличии условия, фильтрует event payload. */
export const VkOnMessageEvent = ListenerDecorator('message_event');

/**
 * Alias for {@link VkOnMessageEvent}
 */
export const OnMessageEvent = VkOnMessageEvent;
