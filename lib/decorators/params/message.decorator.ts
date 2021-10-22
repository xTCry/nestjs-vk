import { PipeTransform, Type } from '@nestjs/common';
import { VkParamtype } from '../../enums/vk-paramtype.enum';
import { createVkPipesParamDecorator } from '../../utils';

export function Message(): ParameterDecorator;
export function Message(...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
export function Message(property: string, ...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
export function Message(
  property?: string | (Type<PipeTransform> | PipeTransform),
  ...pipes: (Type<PipeTransform> | PipeTransform)[]
) {
  return createVkPipesParamDecorator(VkParamtype.MESSAGE)(property, ...pipes);
}

export const Msg = Message;
