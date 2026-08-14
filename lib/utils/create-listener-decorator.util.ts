import type { ListenerMetadata } from '../interfaces';
import type {
  HandlerType,
  VkHearsListenerArgs,
  VkMessageEventListenerArgs,
  VkUpdatesListenerArgs,
  VkUseListenerArgs,
} from '../types';
import { createAppendDecorator } from '.';

export const VK_LISTENERS_METADATA = 'VK_LISTENERS_METADATA';

type VkUpdatesListenerDecoratorFactory = (
  handlerType: 'vk_updates',
  method: 'on',
) => (...args: VkUpdatesListenerArgs) => MethodDecorator;

type VkUseListenerDecoratorFactory = (
  handlerType: 'vk_updates',
  method: 'use',
) => (...args: VkUseListenerArgs) => MethodDecorator;

type VkHearsListenerDecoratorFactory = (
  handlerType: 'hears',
) => (...args: VkHearsListenerArgs) => MethodDecorator;

type VkHearFallbackListenerDecoratorFactory = (
  handlerType: 'hears',
  method: 'onFallback',
) => (...args: VkUseListenerArgs) => MethodDecorator;

type VkMessageEventListenerDecoratorFactory = (
  handlerType: 'message_event',
) => (...args: VkMessageEventListenerArgs) => MethodDecorator;

export type ListenerDecoratorFactory = VkUpdatesListenerDecoratorFactory &
  VkUseListenerDecoratorFactory &
  VkHearsListenerDecoratorFactory &
  VkHearFallbackListenerDecoratorFactory &
  VkMessageEventListenerDecoratorFactory;

export const ListenerDecorator: ListenerDecoratorFactory & { KEY: string } = ((
    handlerType: HandlerType,
    method?: string,
  ) =>
  (event?: unknown, ...args: unknown[]) =>
    createAppendDecorator<ListenerMetadata>({ key: VK_LISTENERS_METADATA })({
      handlerType,
      method,
      event,
      args,
    } as ListenerMetadata)) as unknown as ListenerDecoratorFactory & {
  KEY: string;
};

ListenerDecorator.KEY = VK_LISTENERS_METADATA;
