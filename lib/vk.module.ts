import { Module, DynamicModule } from '@nestjs/common';
import { VkCoreModule } from './vk-core.module';
import { VkModuleOptions, VkModuleAsyncOptions, VkManagersOptions } from './interfaces';
import { VK_MANAGERS_OPTIONS } from './vk.constants';
import { sessionManagerProvider, sceneManagerProvider, hearManagerProvider } from './providers';

@Module({})
export class VkModule {
  public static forRoot(options: VkModuleOptions): DynamicModule {
    return {
      module: VkModule,
      imports: [VkCoreModule.forRoot(options)],
    };
  }

  public static forManagers(options: VkManagersOptions): DynamicModule {
    const providers = [
      {
        provide: VK_MANAGERS_OPTIONS,
        useValue: options,
      },
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
