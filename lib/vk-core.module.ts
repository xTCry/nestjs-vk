import { DiscoveryModule, ModuleRef } from '@nestjs/core';
import { DynamicModule, Global, Inject, Module, OnApplicationShutdown, Provider, Type } from '@nestjs/common';
import { VK } from 'vk-io';

import { VkModuleAsyncOptions, VkModuleOptions, VkOptionsFactory } from './interfaces';
import { VK_API_NAME, VK_MODULE_OPTIONS } from './vk.constants';
import { ListenersExplorerService, MetadataAccessorService } from './services';
import { sessionManagerProvider, sceneManagerProvider, hearManagerProvider } from './providers';
import { createVkApiFactory, getVkApiToken } from './utils';

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
      sessionManagerProvider,
      sceneManagerProvider,
      hearManagerProvider,
      vkApiNameProvider,
      vkApiProvider,
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
      useFactory: async (options: VkModuleOptions) => await createVkApiFactory(options),
      inject: [VK_MODULE_OPTIONS],
    };

    const asyncProviders = this.createAsyncProviders(options);
    
    const providers = [
      sessionManagerProvider,
      sceneManagerProvider,
      hearManagerProvider,
      vkApiNameProvider,
      vkApiProvider,
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

  private static createAsyncProviders(options: VkModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<VkOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: VkModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: VK_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    // `as Type<VkOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [(options.useClass || options.useExisting) as Type<VkOptionsFactory>];
    return {
      provide: VK_MODULE_OPTIONS,
      useFactory: async (optionsFactory: VkOptionsFactory) => await optionsFactory.createVkOptions(),
      inject,
    };
  }
}
