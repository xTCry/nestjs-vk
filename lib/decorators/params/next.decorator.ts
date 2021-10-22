import { createVkParamDecorator } from '../../utils/param-decorator.util';
import { VkParamtype } from '../../enums/vk-paramtype.enum';

export const Next: () => ParameterDecorator = createVkParamDecorator(VkParamtype.NEXT);
