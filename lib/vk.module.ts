import { DynamicModule, Module } from '@nestjs/common';

import {
  VkManagersOptions,
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
    options: VkManagersOptions,
    vkName?: string,
  ): DynamicModule {
    const providers = [
      { provide: getVkManagersOptionsToken(vkName), useValue: options },
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
