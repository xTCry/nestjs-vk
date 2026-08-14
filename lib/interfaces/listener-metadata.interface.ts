import type {
  VkHearsListenerMetadata,
  VkMessageEventListenerMetadata,
  VkUpdatesListenerMetadata,
} from '../types';

export type ListenerMetadata =
  | VkUpdatesListenerMetadata
  | VkHearsListenerMetadata
  | VkMessageEventListenerMetadata;
