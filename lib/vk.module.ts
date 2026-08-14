import { DynamicModule, Module } from '@nestjs/common';

import {
  VkManagersOptions,
  VkManagersOptionsInput,
  VkModuleAsyncOptions,
  VkModuleOptions,
} from './interfaces';
import { getVkManagersOptionsToken } from './utils';
import { VkCoreModule } from './vk-core.module';

@Module({})
export class VkModule {
  public static forRoot(options: VkModuleOptions): DynamicModule {
    return {
      module: VkModule,
      imports: [VkCoreModule.forRoot(options)],
    };
  }

  public static forManagers(
    options: VkManagersOptionsInput,
    vkName?: string,
  ): DynamicModule {
    const providers = [
      {
        provide: getVkManagersOptionsToken(vkName),
        useValue: this.normalizeManagersOptions(options),
      },
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

  private static normalizeManagersOptions(
    options: VkManagersOptionsInput,
  ): VkManagersOptions {
    if (options !== false) {
      return options;
    }

    return {
      useSessionManager: false,
      useSceneManager: false,
      useHearManager: false,
    };
  }
}
