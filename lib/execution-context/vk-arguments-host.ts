import { ArgumentsHost } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { IVkArgumentsHost } from './vk-arguments-host.interace';

export class VkArgumentsHost extends ExecutionContextHost implements IVkArgumentsHost {
  static create(context: ArgumentsHost): IVkArgumentsHost {
    const type = context.getType();
    const vkContext = new VkArgumentsHost(context.getArgs());
    vkContext.setType(type);
    return vkContext;
  }

  getContext<T = any>(): T {
    return this.getArgByIndex(0);
  }

  getNext<T = any>(): T {
    return this.getArgByIndex(1);
  }
}
