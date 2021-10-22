import { Inject } from '@nestjs/common';
import { getBotToken } from '../../utils';

export const InjectVkBot = (botName?: string): ParameterDecorator => Inject(getBotToken(botName));
