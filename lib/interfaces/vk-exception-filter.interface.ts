import { ArgumentsHost } from '@nestjs/common';

export interface VkExceptionFilter<T = any> {
  catch(exception: T, host: ArgumentsHost): any;
}
