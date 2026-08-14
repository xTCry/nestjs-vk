import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { Middleware } from 'middleware-io';
import { IWebhookTransportStartOptions, MessageContext } from 'vk-io';
import { VKOptions } from 'vk-io/lib/types';
import { HearManager } from '@vk-io/hear';
import { SceneManager } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';

export interface VkManagersOptions {
  useSessionManager?: boolean | SessionManager;
  useSceneManager?: boolean | SceneManager;
  useHearManager?: boolean | HearManager<MessageContext>;
}

export interface VkModuleOptions {
  token: string;
  options?: Partial<VKOptions>;

  /**
   * Vk name for provider
   */
  vkName?: string;

  middlewaresBefore?: ReadonlyArray<Middleware<any>>;
  middlewaresAfter?: ReadonlyArray<Middleware<any>>;

  replyOptions?: IVkReplyOptions;
  /** @deprecated Instead use `{ replyOptions: { replyTo: false } }` */
  notReplyMessage?: boolean;

  /**
   * Launch options
   *
   * If `false`, the bot will not be launched.
   */
  launchOptions?: { webhook?: IWebhookTransportStartOptions } | false;

  /**
   * List of modules to include (whitelist) into the discovery process.
   */
  include?: Function[];
}

export interface VkOptionsFactory {
  createVkOptions(): Promise<VkModuleOptions> | VkModuleOptions;
}

export interface VkModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  vkName?: string;
  useExisting?: Type<VkOptionsFactory>;
  useClass?: Type<VkOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<VkModuleOptions> | VkModuleOptions;
  inject?: any[];
}

export type IVkReplyOptions = {
  replyTo?: boolean;
  // markup?: 'html' | 'markdown';
};
