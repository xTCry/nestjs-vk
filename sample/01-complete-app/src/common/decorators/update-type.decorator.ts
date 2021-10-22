import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { VkExecutionContext } from '../../../../../';

export const UpdateType = createParamDecorator(
  (_, ctx: ExecutionContext) => VkExecutionContext.create(ctx).getContext().updateType,
);
