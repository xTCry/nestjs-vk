import { assignMetadata, ParamData, PipeTransform, Type } from '@nestjs/common';
import { isNil, isString } from '@nestjs/common/utils/shared.utils';

import { VkParamtype } from '../execution-context';
import { PARAM_ARGS_METADATA } from '../vk.constants';

type PipesParamData = ParamData | Type<PipeTransform> | PipeTransform;
type VkParameterDecoratorTarget = object & { constructor: Function };
type VkPipe = Type<PipeTransform> | PipeTransform;

export const createVkParamDecorator = (paramtype: VkParamtype) => {
  return (data?: ParamData): ParameterDecorator =>
    (target, key, index) => {
      if (key === undefined) {
        return;
      }

      const args =
        Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, key) || {};
      Reflect.defineMetadata(
        PARAM_ARGS_METADATA,
        assignMetadata(args, paramtype, index, data),
        target.constructor,
        key,
      );
    };
};

export const createVkPipesParamDecorator =
  (paramtype: VkParamtype) =>
  (data?: PipesParamData, ...pipes: VkPipe[]): ParameterDecorator =>
  (target, key, index) => {
    if (key === undefined) {
      return;
    }

    addPipesMetadata(paramtype, data, pipes, target, key, index);
  };

export const addPipesMetadata = (
  paramtype: VkParamtype,
  data: PipesParamData | undefined,
  pipes: VkPipe[],
  target: VkParameterDecoratorTarget,
  key: string | symbol,
  index: number,
) => {
  const args =
    Reflect.getMetadata(PARAM_ARGS_METADATA, target.constructor, key) || {};
  const hasParamData =
    isNil(data) || isString(data) || typeof data === 'number';
  const paramData = hasParamData ? data : undefined;
  const paramPipes: VkPipe[] =
    hasParamData || data === undefined ? pipes : [data as VkPipe, ...pipes];

  Reflect.defineMetadata(
    PARAM_ARGS_METADATA,
    assignMetadata(args, paramtype, index, paramData, ...paramPipes),
    target.constructor,
    key,
  );
};
