import { Module } from '@nestjs/common';
import { ResourceValidatorService } from '@novu/application-generic';

import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { DomainsController } from './domains.controller';
import { USE_CASES } from './usecases';

@Module({
  imports: [SharedModule, AuthModule],
  controllers: [DomainsController],
  providers: [...USE_CASES, ResourceValidatorService],
  exports: [...USE_CASES],
})
export class DomainsModule {}
