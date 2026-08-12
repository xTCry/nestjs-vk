import { DynamicModule, Module } from '@nestjs/common';

import {
  VkManagersOptions,
  VkModuleAsyncOptions,
  VkModuleOptions,
} from './interfaces';
import {
  createHearManagerProvider,
  createLegacyHearManagerProvider,
  createLegacySceneManagerProvider,
  createLegacySessionManagerProvider,
  createSceneManagerProvider,
  createSessionManagerProvider,
  hearManagerProvider,
  sceneManagerProvider,
  sessionManagerProvider,
} from './providers';
import { getVkManagersOptionsToken } from './utils';
import { VkCoreModule } from './vk-core.module';
import { VK_MANAGERS_OPTIONS } from './vk.constants';

@Module({})
export class VkModule {
  public static forRoot(options: VkModuleOptions): DynamicModule {
    return {
      module: VkModule,
      imports: [VkCoreModule.forRoot(options)],
    };
  }

  public static forManagers(
    options: VkManagersOptions,
    vkName?: string,
  ): DynamicModule {
    const providers = vkName
      ? [
          { provide: getVkManagersOptionsToken(vkName), useValue: options },
          createSessionManagerProvider(vkName),
          createSceneManagerProvider(vkName),
          createHearManagerProvider(vkName),
          createLegacySessionManagerProvider(vkName),
          createLegacySceneManagerProvider(vkName),
          createLegacyHearManagerProvider(vkName),
        ]
      : [
          { provide: VK_MANAGERS_OPTIONS, useValue: options },
          sessionManagerProvider,
          sceneManagerProvider,
          hearManagerProvider,
        ];

    return {
      module: VkModule,
      providers,
      exports: [...providers],
      global: true,
    };
  }

  public static forRootAsync(options: VkModuleAsyncOptions): DynamicModule {
    return {
      module: VkModule,
      imports: [VkCoreModule.forRootAsync(options)],
    };
  }
}
