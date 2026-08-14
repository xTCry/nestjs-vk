import { ContextType, ExecutionContext } from '@nestjs/common';

import { VkArgumentsHost } from './vk-arguments-host';

export type VkContextType = 'vk-io' | ContextType;

export class VkExecutionContext extends VkArgumentsHost {
  static create(context: ExecutionContext): VkExecutionContext {
    const type = context.getType();
    const vkContext = new VkExecutionContext(
      context.getArgs(),
      context.getClass(),
      context.getHandler(),
    );
    vkContext.setType(type);
    return vkContext;
  }
}
