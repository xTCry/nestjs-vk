import type {
  Context,
  IMessageContextSendOptions,
  MessageContext,
  MessageEventAction,
  MessageEventContext,
} from 'vk-io';

import type { IVkReplyOptions } from '../interfaces';

export type VkListenerResult =
  | string
  | IMessageContextSendOptions
  | MessageEventAction
  | null
  | undefined
  | false
  | void;

/** Применяет значение, возвращённое listener-ом, к текущему VK context */
export async function applyListenerResult(
  ctx: Context,
  result: VkListenerResult,
  replyOptions: IVkReplyOptions,
): Promise<void> {
  if (!result) {
    return;
  }

  if (ctx.is(['message'])) {
    await applyMessageResult(ctx as MessageContext, result, replyOptions);
    return;
  }

  if (ctx.is(['message_event'])) {
    await applyMessageEventResult(ctx as MessageEventContext, result);
  }
}

/** Отправляет string/object return value из message listener-а */
async function applyMessageResult(
  ctx: MessageContext,
  result: VkListenerResult,
  replyOptions: IVkReplyOptions,
): Promise<void> {
  if (typeof result !== 'string' && !isRecord(result)) {
    return;
  }

  if (replyOptions.replyTo ?? true) {
    await ctx.reply(result);
    return;
  }

  await ctx.send(result);
}

/** Отвечает на callback button, если listener вернул подходящий action */
async function applyMessageEventResult(
  ctx: MessageEventContext,
  result: VkListenerResult,
): Promise<void> {
  if (typeof result === 'string') {
    await ctx.answer({ type: 'show_snackbar', text: result });
    return;
  }

  if (isMessageEventAction(result)) {
    await ctx.answer(result);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMessageEventAction(value: unknown): value is MessageEventAction {
  return (
    isRecord(value) &&
    typeof value.type === 'string' &&
    ['show_snackbar', 'open_link', 'open_app'].includes(value.type)
  );
}
