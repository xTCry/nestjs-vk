import { Module, DynamicModule } from '@nestjs/common';
import { VkCoreModule } from './vk-core.module';
import { VkModuleOptions, VkModuleAsyncOptions } from './interfaces';

@Module({})
export class VkModule {
  public static forRoot(options: VkModuleOptions): DynamicModule {
    return {
      module: VkModule,
      imports: [VkCoreModule.forRoot(options)],
      exports: [VkCoreModule],
    };
  }

  public static forRootAsync(options: VkModuleAsyncOptions): DynamicModule {
    return {
      module: VkModule,
      imports: [VkCoreModule.forRootAsync(options)],
      exports: [VkCoreModule],
    };
  }
}
