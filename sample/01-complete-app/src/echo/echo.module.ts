import { Module } from '@nestjs/common';

import { EchoService } from './echo.service';
import { EchoUpdate } from './echo.update';

@Module({
  providers: [EchoUpdate, EchoService],
})
export class EchoModule {}
