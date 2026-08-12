import { VkParamtype } from '../../enums/vk-paramtype.enum';
import { createVkParamDecorator } from '../../utils/param-decorator.util';

export const Next: () => ParameterDecorator = createVkParamDecorator(
  VkParamtype.NEXT,
);
