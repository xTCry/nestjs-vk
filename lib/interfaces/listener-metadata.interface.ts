import { HandlerType } from '../types';

export interface ListenerMetadata {
  handlerType: HandlerType;
  method?: string;
  event: any;
  args: unknown[];
}
