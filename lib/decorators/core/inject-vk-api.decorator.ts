import { Inject } from '@nestjs/common';
import { getVkApiToken } from '../../utils';

export const InjectVkApi = (vkName?: string): ParameterDecorator => Inject(getVkApiToken(vkName));
