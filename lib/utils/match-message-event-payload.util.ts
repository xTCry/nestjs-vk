import type { MessageEventContext } from 'vk-io';

import type { MessageEventCondition, MessageEventPayload } from '../decorators/listeners/on-message-event.decorator';

/** Проверяет, что payload callback-события VK соответствует условию listener-а. */
export function matchMessageEventPayload(
  payload: unknown,
  condition: MessageEventCondition | undefined,
  context: MessageEventContext,
): boolean {
  if (condition === undefined) {
    return true;
  }

  if (typeof condition === 'function') {
    return isRecord(payload) && condition(payload, context);
  }

  if (!isRecord(payload)) {
    return false;
  }

  return Object.entries(condition).every(([key, value]) => matchValue(payload[key], value));
}

/** Сужает неизвестное значение до объекта, доступного для проверки полей. */
function isRecord(value: unknown): value is MessageEventPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Сопоставляет скалярные значения напрямую, а вложенные объекты - рекурсивно. */
function matchValue(value: unknown, condition: unknown): boolean {
  if (condition instanceof RegExp) {
    return typeof value === 'string' && condition.test(value);
  }

  if (!isRecord(condition)) {
    return value === condition;
  }

  return (
    isRecord(value) &&
    Object.entries(condition).every(([key, nestedCondition]) => matchValue(value[key], nestedCondition))
  );
}
