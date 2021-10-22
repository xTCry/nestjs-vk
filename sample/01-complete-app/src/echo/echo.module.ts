import { Module } from '@nestjs/common';
import { EchoUpdate } from './echo.update';
import { EchoService } from './echo.service';

@Module({
  providers: [EchoUpdate, EchoService],
})
export class EchoModule {}
