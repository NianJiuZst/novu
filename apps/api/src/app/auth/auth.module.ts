import { Global, MiddlewareConsumer, Module, ModuleMetadata } from '@nestjs/common';
import { isClerkEnabled } from '@novu/shared';
import { getCommunityAuthModuleConfig, configure as configureCommunity } from './community.auth.module.config';
import { getEEModuleConfig, configure as configureEE } from './ee.auth.module.config';

function getModuleConfig(): ModuleMetadata {
  // eslint-disable-next-line no-console
  console.error('isClerkEnabled', isClerkEnabled());

  // eslint-disable-next-line no-console
  console.log('process.env.CLERK_ENABLED', process.env.CLERK_ENABLED);
  if (isClerkEnabled()) {
    return getEEModuleConfig();
  } else {
    return getCommunityAuthModuleConfig();
  }
}

@Global()
@Module(getModuleConfig())
export class AuthModule {
  public configure(consumer: MiddlewareConsumer) {
    if (isClerkEnabled()) {
      configureEE(consumer);
    } else {
      configureCommunity(consumer);
    }
  }
}
