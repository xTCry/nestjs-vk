import { Inject } from '@nestjs/common';
import { getVkApiToken } from '../../utils';

export const InjectVkApi = (vkName?: string) => Inject(getVkApiToken(vkName));
