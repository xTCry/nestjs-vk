import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import { DiscoveryModule, ModuleRef } from '@nestjs/core';
import { VK } from 'vk-io';

import {
  VkModuleAsyncOptions,
  VkModuleOptions,
  VkOptionsFactory,
} from './interfaces';
import {
  createHearManagerProvider,
  createLegacyHearManagerProvider,
  createLegacySceneManagerProvider,
  createLegacySessionManagerProvider,
  createSceneManagerProvider,
  createSessionManagerProvider,
} from './providers';
import { ListenersExplorerService, MetadataAccessorService } from './services';
import { createVkApiFactory, getVkApiToken } from './utils';
import {
  DEFAULT_VK_API_NAME,
  VK_API_NAME,
  VK_MODULE_OPTIONS,
} from './vk.constants';

const createManagerProviders = (vkName?: string): Provider[] => {
  const providers = [
    createHearManagerProvider(vkName),
    createSessionManagerProvider(vkName),
    createSceneManagerProvider(vkName),
  ];

  if (!vkName || vkName === DEFAULT_VK_API_NAME) {
    return providers;
  }

  return [
    ...providers,
    createLegacyHearManagerProvider(vkName),
    createLegacySessionManagerProvider(vkName),
    createLegacySceneManagerProvider(vkName),
  ];
};

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [ListenersExplorerService, MetadataAccessorService],
})
export class VkCoreModule implements OnApplicationShutdown {
  constructor(
    @Inject(VK_API_NAME)
    private readonly vkApiName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

  public static forRoot(options: VkModuleOptions): DynamicModule {
    const vkApiName = getVkApiToken(options.vkName);

    const vkApiNameProvider = {
      provide: VK_API_NAME,
      useValue: vkApiName,
    };

    const vkApiProvider: Provider = {
      provide: vkApiName,
      useFactory: async () => await createVkApiFactory(options),
    };

    const providers = [
      vkApiNameProvider,
      vkApiProvider,
      ...createManagerProviders(options.vkName),
    ];

    return {
      module: VkCoreModule,
      providers: [
        {
          provide: VK_MODULE_OPTIONS,
          useValue: options,
        },
        ...providers,
      ],
      exports: [...providers],
    };
  }

  public static forRootAsync(options: VkModuleAsyncOptions): DynamicModule {
    const vkApiName = getVkApiToken(options.vkName);

    const vkApiNameProvider = {
      provide: VK_API_NAME,
      useValue: vkApiName,
    };

    const vkApiProvider: Provider = {
      provide: vkApiName,
      useFactory: async (options: VkModuleOptions) =>
        await createVkApiFactory(options),
      inject: [VK_MODULE_OPTIONS],
    };

    const asyncProviders = this.createAsyncProviders(options);
    const providers = [
      vkApiNameProvider,
      vkApiProvider,
      ...createManagerProviders(options.vkName),
    ];

    return {
      module: VkCoreModule,
      imports: options.imports,
      providers: [...asyncProviders, ...providers],
      exports: [...providers],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const vk = this.moduleRef.get<VK>(this.vkApiName);
    vk && (await vk.updates.stop());
  }

  private static createAsyncProviders(
    options: VkModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: VkModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: VK_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    // `as Type<VkOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [options.useClass || options.useExisting];
    return {
      provide: VK_MODULE_OPTIONS,
      useFactory: async (optionsFactory: VkOptionsFactory) =>
        await optionsFactory.createVkOptions(),
      inject,
    };
  }
}
