/* eslint-disable global-require */
import { PlatformException, cacheService } from '@novu/application-generic';
import { MiddlewareConsumer, ModuleMetadata } from '@nestjs/common';
import { RootEnvironmentGuard } from './framework/root-environment-guard.service';
import { ApiKeyStrategy } from './services/passport/apikey.strategy';
import { SandboxStrategy } from './services/passport/sandbox.strategy';
import { JwtSubscriberStrategy } from './services/passport/subscriber-jwt.strategy';
import { OrganizationModule } from '../organization/organization.module';
import { RolesGuard } from './framework/roles.guard';
import { UserRegister } from './usecases/register/user-register.usecase';
import { SandboxModule } from './sandbox/sandbox.module';

function getEEAuthProviders() {
  const eeAuthPackage = require('@novu/ee-auth');

  return eeAuthPackage.injectEEAuthProviders();
}

export function getEEModuleConfig(): ModuleMetadata {
  const eeAuthPackage = require('@novu/ee-auth');
  const eeAuthModule = eeAuthPackage?.eeAuthModule;

  if (!eeAuthModule) {
    throw new PlatformException('ee-auth module is not loaded');
  }

  return {
    imports: [...eeAuthModule.imports, OrganizationModule],
    controllers: [...eeAuthModule.controllers],
    providers: [
      ...eeAuthModule.providers,
      ...getEEAuthProviders(),
      // reused services
      ApiKeyStrategy,
      SandboxStrategy,
      JwtSubscriberStrategy,
      cacheService,
      RolesGuard,
      RootEnvironmentGuard,
      UserRegister,
    ],
    exports: [
      ...eeAuthModule.exports,
      RolesGuard,
      RootEnvironmentGuard,
      'USER_REPOSITORY',
      'MEMBER_REPOSITORY',
      'ORGANIZATION_REPOSITORY',
    ],
  };
}

export function configure(consumer: MiddlewareConsumer) {
  const eeAuthPackage = require('@novu/ee-auth');

  if (!eeAuthPackage?.configure) {
    throw new PlatformException('ee-auth configure() is not loaded');
  }

  eeAuthPackage.configure(consumer);
}
