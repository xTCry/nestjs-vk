import { VkParamtype } from '../../execution-context';
import { createVkParamDecorator } from '../../utils/param-decorator.util';

export const VkNext: () => ParameterDecorator = createVkParamDecorator(
  VkParamtype.NEXT,
);

/**
 * Alias for {@link VkNext}
 */
export const Next = VkNext;
