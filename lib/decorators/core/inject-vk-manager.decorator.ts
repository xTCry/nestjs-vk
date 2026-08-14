import { Inject } from '@nestjs/common';

import {
  getVkHearManagerToken,
  getVkSceneManagerToken,
  getVkSessionManagerToken,
} from '../../utils';

export const InjectVkHearManager = (vkName?: string) =>
  Inject(getVkHearManagerToken(vkName));

export const InjectVkSessionManager = (vkName?: string) =>
  Inject(getVkSessionManagerToken(vkName));

export const InjectVkSceneManager = (vkName?: string) =>
  Inject(getVkSceneManagerToken(vkName));
