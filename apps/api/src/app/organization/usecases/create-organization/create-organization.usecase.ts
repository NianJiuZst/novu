import { BadRequestException, Injectable } from '@nestjs/common';
import { AnalyticsService } from '@novu/application-generic';
import { OrganizationEntity, OrganizationRepository, UserRepository } from '@novu/dal';
import { ApiServiceLevelEnum, EnvironmentEnum, JobTitleEnum, MemberRoleEnum } from '@novu/shared';

import { CreateEnvironmentCommand } from '../../../environments-v1/usecases/create-environment/create-environment.command';
import { CreateEnvironment } from '../../../environments-v1/usecases/create-environment/create-environment.usecase';
import { AddMemberCommand } from '../membership/add-member/add-member.command';
import { AddMember } from '../membership/add-member/add-member.usecase';
import { CreateOrganizationCommand } from './create-organization.command';

@Injectable()
export class CreateOrganization {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly addMemberUsecase: AddMember,
    private readonly userRepository: UserRepository,
    private readonly createEnvironmentUsecase: CreateEnvironment,
    private analyticsService: AnalyticsService
  ) {}

  async execute(command: CreateOrganizationCommand): Promise<OrganizationEntity> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) throw new BadRequestException('User not found');

    const isSelfHosted = process.env.IS_SELF_HOSTED === 'true';
    const isEnterprise = process.env.NOVU_ENTERPRISE === 'true' || process.env.CI_EE_TEST === 'true';
    const defaultApiServiceLevel =
      isSelfHosted && isEnterprise ? ApiServiceLevelEnum.UNLIMITED : ApiServiceLevelEnum.FREE;

    const createdOrganization = await this.organizationRepository.create({
      logo: command.logo,
      name: command.name,
      apiServiceLevel: command.apiServiceLevel || defaultApiServiceLevel,
      domain: command.domain,
      language: command.language,
    });

    if (command.jobTitle) {
      await this.updateJobTitle(user, command.jobTitle);
    }

    await this.addMemberUsecase.execute(
      AddMemberCommand.create({
        roles: [MemberRoleEnum.OSS_ADMIN],
        organizationId: createdOrganization._id,
        userId: command.userId,
      })
    );

    const devEnv = await this.createEnvironmentUsecase.execute(
      CreateEnvironmentCommand.create({
        userId: user._id,
        name: EnvironmentEnum.DEVELOPMENT,
        organizationId: createdOrganization._id,
        system: true,
      })
    );

    this.createEnvironmentUsecase
      .execute(
        CreateEnvironmentCommand.create({
          userId: user._id,
          name: EnvironmentEnum.PRODUCTION,
          organizationId: createdOrganization._id,
          parentEnvironmentId: devEnv._id,
          system: true,
        })
      )
      .catch(() => {
        // Production environment creation failed, but don't block organization creation
      });

    // Fire-and-forget analytics tracking to avoid blocking organization creation
    setImmediate(() => {
      try {
        this.analyticsService.upsertGroup(createdOrganization._id, createdOrganization, user);
        this.analyticsService.track('[Authentication] - Create Organization', user._id, {
          _organization: createdOrganization._id,
          language: command.language,
          creatorJobTitle: command.jobTitle,
        });
      } catch (error) {
        // Silently fail - analytics errors should not affect organization creation
        console.error('Analytics tracking failed:', error);
      }
    });

    return createdOrganization;
  }

  private async updateJobTitle(user, jobTitle: JobTitleEnum) {
    await this.userRepository.update(
      {
        _id: user._id,
      },
      {
        $set: {
          jobTitle,
        },
      }
    );

    // Fire-and-forget analytics tracking
    setImmediate(() => {
      try {
        this.analyticsService.setValue(user._id, 'jobTitle', jobTitle);
      } catch (error) {
        // Silently fail - analytics errors should not affect job title update
        console.error('Analytics tracking failed:', error);
      }
    });
  }
}
