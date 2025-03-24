import { Module } from '@nestjs/common';

import { CommunityOrganizationRepository } from '@novu/dal';
import { OrganizationModule } from '../../organization/organization.module';
import { UserRegister } from '../usecases/register/user-register.usecase';
import { SharedModule } from '../../shared/shared.module';
import { SandboxBootstrapService } from './sandbox-bootstrap.service';
import { AuthModule } from '../auth.module';

@Module({
  imports: [AuthModule, OrganizationModule, SharedModule],
  providers: [SandboxBootstrapService, UserRegister, CommunityOrganizationRepository],
  exports: [SandboxBootstrapService],
})
export class SandboxModule {}
