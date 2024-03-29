import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { Middleware } from 'middleware-io';
import { IWebhookTransportStartOptions, MessageContext } from 'vk-io';
import { VKOptions } from 'vk-io/lib/types';
import { SessionManager } from '@vk-io/session';
import { SceneManager } from '@vk-io/scenes';
import { HearManager } from '@vk-io/hear';

export interface VkManagersOptions {
  useSessionManager?: boolean | SessionManager;
  useSceneManager?: boolean | SceneManager;
  useHearManager?: boolean | HearManager<MessageContext>;
}

export interface VkModuleOptions {
  token: string;
  vkName?: string;
  options?: Partial<VKOptions>;
  launchOptions?: { webhook?: IWebhookTransportStartOptions } | false;
  include?: Function[];
  middlewaresBefore?: ReadonlyArray<Middleware<any>>;
  middlewaresAfter?: ReadonlyArray<Middleware<any>>;
  notReplyMessage?: boolean;
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
