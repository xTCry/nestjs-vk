import type { Middleware } from 'middleware-io';
import type {
  Context,
  ContextSubTypes,
  ContextTypes,
  MessageEventContext,
} from 'vk-io';
import type { AllowArray } from 'vk-io/lib/types';
import type { HearConditions } from '@vk-io/hear';

export type HandlerType = 'vk_updates' | 'hears' | 'message_event';

export type VkUpdateEvent = ContextTypes | ContextSubTypes;
export type VkUpdateMiddleware = Middleware<Context>;

export type VkListenerDecoratorArgs<
  TEvent = unknown,
  TArgs extends readonly unknown[] = readonly unknown[],
> = [event?: TEvent, ...args: TArgs];

export type VkUpdatesListenerArgs = VkListenerDecoratorArgs<
  AllowArray<VkUpdateEvent>,
  Middleware<Context>[]
>;

export type VkUseListenerArgs = VkListenerDecoratorArgs<undefined>;

export type VkHearsMiddleware = Middleware<Context>;

export type VkHearsListenerArgs = VkListenerDecoratorArgs<
  HearConditions<Record<string, any>>,
  VkHearsMiddleware[]
>;

export type VkHearsCondition = VkHearsListenerArgs[0];

export type VkHearFallbackListenerArgs = VkListenerDecoratorArgs<undefined>;

// * MessageEvent

export interface VkMessageEventPayload {
  [key: string]: VkMessageEventPayloadValue;
}

export type VkMessageEventPayloadValue =
  | string
  | number
  | boolean
  | null
  | RegExp
  | VkMessageEventPayload;

export type VkMessageEventCondition<
  TPayload extends VkMessageEventPayload = VkMessageEventPayload,
> =
  | string
  | RegExp
  | Record<string, VkMessageEventPayloadValue>
  | ((payload: TPayload, ctx: MessageEventContext) => boolean);

export type VkMessageEventListenerArgs<
  TPayload extends VkMessageEventPayload = VkMessageEventPayload,
> = VkListenerDecoratorArgs<VkMessageEventCondition<TPayload>>;

// * Listener

export type VkUpdatesListenerMetadata =
  | {
      handlerType: 'vk_updates';
      method: 'on';
      event: VkUpdatesListenerArgs[0];
      args: VkUpdateMiddleware[];
    }
  | {
      handlerType: 'vk_updates';
      method: 'use';
      event: undefined;
      args: [];
    };

export type VkHearsListenerMetadata =
  | {
      handlerType: 'hears';
      method: undefined;
      event: VkHearsListenerArgs[0];
      args: VkHearsMiddleware[];
    }
  | {
      handlerType: 'hears';
      method: 'onFallback';
      event: undefined;
      args: [];
    };

export type VkMessageEventListenerMetadata<
  TPayload extends VkMessageEventPayload = VkMessageEventPayload,
> = {
  handlerType: 'message_event';
  method: undefined;
  event: VkMessageEventListenerArgs<TPayload>[0];
  args: [];
};
