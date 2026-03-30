import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { AgentsController } from './agents.controller';
import { USE_CASES } from './usecases';

@Module({
  imports: [SharedModule, AuthModule],
  providers: [...USE_CASES],
  controllers: [AgentsController],
  exports: [...USE_CASES],
})
export class AgentsModule {}
