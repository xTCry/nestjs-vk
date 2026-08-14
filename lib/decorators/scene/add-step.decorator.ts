import { SetMetadata } from '@nestjs/common';

export const VK_SCENE_STEP_METADATA = 'VK_SCENE_STEP_METADATA';

export const VkAddStep = (step?: number) =>
  SetMetadata<string>(VK_SCENE_STEP_METADATA, step);
VkAddStep.KEY = VK_SCENE_STEP_METADATA;

/**
 * Alias for {@link VkAddStep}
 */
export const AddStep = VkAddStep;
