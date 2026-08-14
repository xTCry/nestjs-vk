import { ArgumentsHost } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { NextMiddleware } from 'middleware-io';
import { Context } from 'vk-io';

import { VkContextType } from './vk-execution-context';

export class VkArgumentsHost extends ExecutionContextHost {
  static create(context: ArgumentsHost): VkArgumentsHost {
    const type = context.getType();
    const vkContext = new VkArgumentsHost(context.getArgs());
    vkContext.setType(type);
    return vkContext;
  }

  public getType<TContext extends string = VkContextType>(): TContext {
    return super.getType();
  }

  public getContext<T = Context>(): T {
    return this.getArgByIndex(0);
  }

  public getNext<T = NextMiddleware>(): T {
    return this.getArgByIndex(1);
  }
}
