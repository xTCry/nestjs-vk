import {
  DynamicModule,
  FactoryProvider,
  Global,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import {
  DiscoveryModule,
  ExternalContextCreator,
  MetadataScanner,
  ModuleRef,
  ModulesContainer,
  Reflector,
} from '@nestjs/core';
import { VK } from 'vk-io';

import {
  VkManagersOptions,
  VkModuleAsyncOptions,
  VkModuleOptions,
  VkOptionsFactory,
} from './interfaces';
import {
  createHearManagerProvider,
  createSceneManagerProvider,
  createSessionManagerProvider,
} from './providers';
import { ListenersExplorerService } from './services';
import {
  createVkApiFactory,
  getVkApiNameToken,
  getVkApiToken,
  getVkHearManagerToken,
  getVkListenersExplorerToken,
  getVkManagersOptionsToken,
  getVkModuleOptionsToken,
  getVkSceneManagerToken,
  getVkSessionManagerToken,
  getVkShutdownServiceToken,
} from './utils';
import { DEFAULT_VK_API_NAME } from './vk.constants';

const isDefaultVkName = (vkName?: string): boolean =>
  !vkName || vkName === DEFAULT_VK_API_NAME;

const createManagerProviders = (vkName?: string): Provider[] => {
  return [
    createHearManagerProvider(vkName),
    createSessionManagerProvider(vkName),
    createSceneManagerProvider(vkName),
  ];
};

const createListenersExplorerProvider = (vkName?: string): FactoryProvider => ({
  provide: getVkListenersExplorerToken(vkName),
  useFactory: (
    reflector: Reflector,
    moduleRef: ModuleRef,
    metadataScanner: MetadataScanner,
    modulesContainer: ModulesContainer,
    externalContextCreator: ExternalContextCreator,
    hearManagerProvider,
    sessionManagerProvider,
    sceneManager,
    vkOptions: VkModuleOptions,
    vkManagersOptions: VkManagersOptions | undefined,
    vkApiName: string,
  ) =>
    new ListenersExplorerService(
      reflector,
      moduleRef,
      metadataScanner,
      modulesContainer,
      externalContextCreator,
      hearManagerProvider,
      sessionManagerProvider,
      sceneManager,
      vkOptions,
      vkManagersOptions,
      vkApiName,
    ),
  inject: [
    Reflector,
    ModuleRef,
    MetadataScanner,
    ModulesContainer,
    ExternalContextCreator,
    { token: getVkHearManagerToken(vkName), optional: true },
    { token: getVkSessionManagerToken(vkName), optional: true },
    { token: getVkSceneManagerToken(vkName), optional: true },
    getVkModuleOptionsToken(vkName),
    { token: getVkManagersOptionsToken(vkName), optional: true },
    getVkApiNameToken(vkName),
  ],
});

const createDefaultListenersExplorerAliasProvider = (): Provider => ({
  provide: ListenersExplorerService,
  useExisting: getVkListenersExplorerToken(),
});

const createVkShutdownProvider = (vkName?: string): FactoryProvider => {
  const vkApiName = getVkApiToken(vkName);

  return {
    provide: getVkShutdownServiceToken(vkName),
    useFactory: (moduleRef: ModuleRef): OnApplicationShutdown => ({
      async onApplicationShutdown(): Promise<void> {
        const vk = moduleRef.get<VK>(vkApiName, { strict: false });
        vk && (await vk.updates.stop());
      },
    }),
    inject: [ModuleRef],
  };
};

const createDefaultCompatibilityProviders = (vkName?: string): Provider[] => {
  if (!isDefaultVkName(vkName)) {
    return [];
  }

  return [createDefaultListenersExplorerAliasProvider()];
};

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [],
})
export class VkCoreModule {
  public static forRoot(options: VkModuleOptions): DynamicModule {
    const vkApiName = getVkApiToken(options.vkName);

    const vkApiNameProvider = {
      provide: getVkApiNameToken(options.vkName),
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
      createListenersExplorerProvider(options.vkName),
      createVkShutdownProvider(options.vkName),
      ...createDefaultCompatibilityProviders(options.vkName),
    ];

    return {
      module: VkCoreModule,
      providers: [
        {
          provide: getVkModuleOptionsToken(options.vkName),
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
      provide: getVkApiNameToken(options.vkName),
      useValue: vkApiName,
    };

    const vkApiProvider: Provider = {
      provide: vkApiName,
      useFactory: async (options: VkModuleOptions) =>
        await createVkApiFactory(options),
      inject: [getVkModuleOptionsToken(options.vkName)],
    };

    const asyncProviders = this.createAsyncProviders(options);
    const providers = [
      vkApiNameProvider,
      vkApiProvider,
      ...createManagerProviders(options.vkName),
      createListenersExplorerProvider(options.vkName),
      createVkShutdownProvider(options.vkName),
      ...createDefaultCompatibilityProviders(options.vkName),
    ];

    return {
      module: VkCoreModule,
      imports: options.imports,
      providers: [...asyncProviders, ...providers],
      exports: [...providers],
    };
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
    const optionsToken = getVkModuleOptionsToken(options.vkName);

    if (options.useFactory) {
      return {
        provide: optionsToken,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    // `as Type<VkOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [options.useClass || options.useExisting];
    return {
      provide: optionsToken,
      useFactory: async (optionsFactory: VkOptionsFactory) =>
        await optionsFactory.createVkOptions(),
      inject,
    };
  }
}
