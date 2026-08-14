import { PipeTransform, Type } from '@nestjs/common';

import { VkParamtype } from '../../execution-context';
import { createVkPipesParamDecorator } from '../../utils';

export function VkMessage(): ParameterDecorator;
export function VkMessage(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function VkMessage(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function VkMessage(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createVkPipesParamDecorator(VkParamtype.MESSAGE)(property, ...pipes);
}

/**
 * Alias for {@link VkMessage}
 */
export const Message = VkMessage;
export const Msg = VkMessage;
