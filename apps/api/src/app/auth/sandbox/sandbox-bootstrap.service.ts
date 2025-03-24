import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';

import { PinoLogger } from '@novu/application-generic';
import { CommunityOrganizationRepository, OrganizationRepository } from '@novu/dal';

import { CreateOrganization } from '../../organization/usecases/create-organization/create-organization.usecase';
import { UserRegister } from '../usecases/register/user-register.usecase';
import { UserRegisterCommand } from '../usecases/register/user-register.command';
import { CreateOrganizationCommand } from '../../organization/usecases/create-organization/create-organization.command';

const CONTEXT = 'SandboxBootstrapService';

/*
 * todo: refactor this code to work with Clerk,
 * this version is working only when Clerk is Off
 */
@Injectable()
export class SandboxBootstrapService implements OnModuleInit {
  private readonly enabled: boolean;
  private readonly organizationName: string = 'Sandbox Organization baking-endanger-luckless';
  private readonly userEmail: string = 'system-sandbox@novu.co';

  constructor(
    private communityOrganizationRepository: CommunityOrganizationRepository,
    private createOrganizationUsecase: CreateOrganization,
    private userRegisterUsecase: UserRegister,
    private logger: PinoLogger
  ) {
    this.enabled = process.env.NOVU_ENTERPRISE === 'true';
    this.logger.error(`SandboxBootstrapService initialized with enabled=${this.enabled}`, CONTEXT);
  }

  async onModuleInit() {
    this.logger.error('SandboxBootstrapService.onModuleInit called', CONTEXT);

    if (!this.enabled) {
      this.logger.error('Sandbox flow is disabled. Skipping bootstrap process.', CONTEXT);

      return;
    }

    this.logger.error('Starting sandbox bootstrap process...', CONTEXT);

    try {
      await this.ensureDefaultOrganization();

      this.logger.error('Sandbox bootstrap process completed successfully.', CONTEXT);
    } catch (error) {
      this.logger.error('Error during sandbox bootstrap process', error.stack, CONTEXT);
      throw error;
    }
  }

  private async ensureDefaultOrganization() {
    const existingOrganization = await this.communityOrganizationRepository.findOne({ name: this.organizationName });

    if (existingOrganization) {
      this.logger.error('Sandbox Organization already exists', existingOrganization);

      return existingOrganization;
    }
    const { user } = await this.userRegisterUsecase.execute(
      UserRegisterCommand.create({
        email: this.userEmail,
        firstName: 'System Sandbox',
        lastName: 'User',
        password: 'systemUser1q@W#',
      })
    );

    if (!user) {
      throw new Error('User not found');
    }

    if (!user) {
      throw new InternalServerErrorException('Sandbox User not found');
    }

    const organization = await this.createOrganizationUsecase.execute(
      CreateOrganizationCommand.create({
        userId: user._id,
        name: this.organizationName,
      })
    );

    this.logger.error(`Default sandbox organization created with ID: ${organization._id}`, CONTEXT);

    return organization;
  }
}
