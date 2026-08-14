import { PipeTransform, Type } from '@nestjs/common';

import { VkParamtype } from '../../execution-context';
import { createVkPipesParamDecorator } from '../../utils/param-decorator.util';

// export const Context: () => ParameterDecorator = createVkParamDecorator(VkParamtype.CONTEXT);

export function VkContext(): ParameterDecorator;
export function VkContext(
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function VkContext(
  property: string,
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
): ParameterDecorator;
export function VkContext(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createVkPipesParamDecorator(VkParamtype.CONTEXT)(property, ...pipes);
}

/**
 * Alias for {@link VkContext}
 */
export const Context = VkContext;
export const Ctx = VkContext;
