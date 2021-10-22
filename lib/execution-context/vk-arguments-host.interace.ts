import { ArgumentsHost } from '@nestjs/common';

export interface IVkArgumentsHost extends ArgumentsHost {
  getContext<T = any>(): T;
  getNext<T = any>(): T;
}
