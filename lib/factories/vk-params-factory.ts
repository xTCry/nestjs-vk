import { ParamData } from '@nestjs/common';
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator';
import { Context } from 'vk-io';
import { VkParamtype } from '../enums/vk-paramtype.enum';

export class VkParamsFactory implements ParamsFactory {
  exchangeKeyForValue(type: VkParamtype, data: ParamData, args: unknown[]): unknown {
    const [ctx, next] = args as [Context, Function];

    switch (type) {
      case VkParamtype.NEXT:
        return next;
      case VkParamtype.CONTEXT:
        return data && ctx ? ctx[data as string] : ctx;
      case VkParamtype.MESSAGE:
        return data && ctx.message ? ctx.message[data as string] : ctx.message;
      default:
        return null;
    }
  }
}
