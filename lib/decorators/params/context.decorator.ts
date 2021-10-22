import { createVkPipesParamDecorator } from '../../utils/param-decorator.util';
import { VkParamtype } from '../../enums/vk-paramtype.enum';
import { PipeTransform, Type } from '@nestjs/common';

// export const Context: () => ParameterDecorator = createVkParamDecorator(VkParamtype.CONTEXT);

export function Context(): ParameterDecorator;
export function Context(...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
export function Context(property: string, ...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
export function Context(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createVkPipesParamDecorator(VkParamtype.CONTEXT)(property, ...pipes);
}

export const Ctx = Context;
