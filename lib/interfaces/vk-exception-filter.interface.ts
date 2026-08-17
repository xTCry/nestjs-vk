import { ArgumentsHost } from '@nestjs/common';

export interface VkExceptionFilter<T = unknown> {
  catch(exception: T, host: ArgumentsHost): unknown;
}
