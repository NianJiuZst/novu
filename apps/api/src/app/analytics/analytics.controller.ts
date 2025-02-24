import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AnalyticsService, ExternalApiAccessible, UserSession } from '@novu/application-generic';
import { UserSessionData } from '@novu/shared';
import { UserAuthentication } from '../shared/framework/swagger/api.key.security';
import { HubspotIdentifyFormCommand } from './usecases/hubspot-identify-form/hubspot-identify-form.command';
import { HubspotIdentifyFormUsecase } from './usecases/hubspot-identify-form/hubspot-identify-form.usecase';

const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'proton.me',
  'protonmail.com',
  'me.com',
  'live.com',
  'msn.com',
];

function extractBusinessDomain(email: string | null | undefined): string {
  if (!email) return '';

  const domain = email.split('@')[1];
  if (!domain) return '';

  return PERSONAL_EMAIL_DOMAINS.includes(domain.toLowerCase()) ? '' : domain;
}

@Controller({
  path: 'telemetry',
})
@SkipThrottle()
@ApiExcludeController()
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private hubspotIdentifyFormUsecase: HubspotIdentifyFormUsecase
  ) {}

  @Post('/measure')
  @ExternalApiAccessible()
  @UserAuthentication()
  async trackEvent(@Body('event') event, @Body('data') data = {}, @UserSession() user: UserSessionData): Promise<any> {
    this.analyticsService.track(event, user._id, {
      ...(data || {}),
      _organization: user?.organizationId,
    });

    return {
      success: true,
    };
  }

  @Post('/identify')
  @ExternalApiAccessible()
  @UserAuthentication()
  @HttpCode(HttpStatus.NO_CONTENT)
  async identifyUser(@Body() body: any, @UserSession() user: UserSessionData) {
    if (body.anonymousId) {
      this.analyticsService.alias(body.anonymousId, user._id);
    }

    this.analyticsService.upsertUser(user, user._id, {
      organizationType: body.organizationType,
      companySize: body.companySize,
      jobTitle: body.jobTitle,
    });

    this.analyticsService.updateGroup(user._id, user.organizationId, {
      organizationType: body.organizationType,
      companySize: body.companySize,
      jobTitle: body.jobTitle,
      website: extractBusinessDomain(user.email),
    });

    await this.hubspotIdentifyFormUsecase.execute(
      HubspotIdentifyFormCommand.create({
        email: user.email as string,
        lastName: user.lastName,
        firstName: user.firstName,
        hubspotContext: body.hubspotContext,
        pageUri: body.pageUri,
        pageName: body.pageName,
        organizationId: user.organizationId,
      })
    );
  }
}
