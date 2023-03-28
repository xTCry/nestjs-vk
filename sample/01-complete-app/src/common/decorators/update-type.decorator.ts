import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { VkExecutionContext } from 'nestjs-vk';

export const UpdateType = createParamDecorator(
  (_, ctx: ExecutionContext) =>
    VkExecutionContext.create(ctx).getContext().updateType,
);
