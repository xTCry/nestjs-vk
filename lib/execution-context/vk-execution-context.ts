import { ContextType, ExecutionContext } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { IVkArgumentsHost } from './vk-arguments-host.interface';

export type VkontextType = 'vk-io' | ContextType;

export class VkExecutionContext extends ExecutionContextHost implements IVkArgumentsHost {
  static create(context: ExecutionContext): VkExecutionContext {
    const type = context.getType();
    const vkContext = new VkExecutionContext(context.getArgs(), context.getClass(), context.getHandler());
    vkContext.setType(type);
    return vkContext;
  }

  getType<TContext extends string = VkontextType>(): TContext {
    return super.getType();
  }

  getContext<T = any>(): T {
    return this.getArgByIndex(0);
  }

  getNext<T = any>(): T {
    return this.getArgByIndex(1);
  }
}
