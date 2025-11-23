import { Module, Global } from '@nestjs/common';
import { ProtoService } from './proto.service';

@Global()
@Module({
  providers: [ProtoService],
  exports: [ProtoService],
})
export class ProtoModule {}
