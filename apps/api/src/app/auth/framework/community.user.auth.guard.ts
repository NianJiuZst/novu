import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ApiAuthSchemeEnum, IJwtClaims, PassportStrategyEnum, HandledUser, NONE_AUTH_SCHEME } from '@novu/shared';
import { PinoLogger } from '@novu/application-generic';

@Injectable()
export class CommunityUserAuthGuard extends AuthGuard([
  PassportStrategyEnum.JWT,
  PassportStrategyEnum.HEADER_API_KEY,
  // todo remove SandboxStrategy as it will not be used in community edition
  PassportStrategyEnum.SANDBOX,
]) {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: PinoLogger
  ) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions<any> {
    // eslint-disable-next-line no-console
    console.log('CommunityUserAuthGuard');

    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;
    const applicationIdentifier = request.headers['x-application-identifier'];

    // eslint-disable-next-line no-console
    console.log('applicationIdentifier 565656 ', applicationIdentifier);
    // eslint-disable-next-line no-console
    console.log('authorizationHeader 565656 ', `'${authorizationHeader}'`);

    const authScheme = authorizationHeader?.split(' ')[0] || NONE_AUTH_SCHEME;
    request.authScheme = authScheme;

    // eslint-disable-next-line no-console
    console.log('authScheme 565656 ', `'${authScheme}'`);

    this.logger.assign({ authScheme });

    switch (authScheme) {
      case ApiAuthSchemeEnum.BEARER:
        return {
          session: false,
          defaultStrategy: PassportStrategyEnum.JWT,
        };
      case ApiAuthSchemeEnum.API_KEY: {
        const apiEnabled = this.reflector.get<boolean>('external_api_accessible', context.getHandler());
        if (!apiEnabled) throw new UnauthorizedException('API endpoint not available');

        return {
          session: false,
          defaultStrategy: PassportStrategyEnum.HEADER_API_KEY,
        };
      }
      case ApiAuthSchemeEnum.SANDBOX: {
        const sandboxEnabled = this.reflector.get<boolean>('sandbox_accessible', context.getHandler());

        // eslint-disable-next-line no-console
        console.log('sandboxEnabled 565656 ', sandboxEnabled);
        if (!sandboxEnabled) throw new UnauthorizedException('API endpoint not available');

        // eslint-disable-next-line no-console
        console.log('sandboxEnabled 565656 ', sandboxEnabled);

        return {
          session: false,
          defaultStrategy: PassportStrategyEnum.SANDBOX,
        };
      }
      case NONE_AUTH_SCHEME:
        throw new UnauthorizedException('Missing authorization header');
      default:
        throw new UnauthorizedException(`Invalid authentication scheme: "${authScheme}"`);
    }
  }

  handleRequest<TUser = IJwtClaims>(
    err: any,
    user: IJwtClaims | false,
    info: any,
    context: ExecutionContext,
    status?: any
  ): TUser {
    let handledUser: HandledUser;

    if (typeof user === 'object') {
      /**
       * This helps with sentry and other tools that need to know who the user is based on `id` property.
       */
      handledUser = {
        ...user,
        id: user._id,
        username: (user.firstName || '').trim(),
        domain: user.email?.split('@')[1] || '',
      };
    } else {
      handledUser = user;
    }

    this.logger.assign({ user: handledUser });

    return super.handleRequest(err, handledUser, info, context, status);
  }
}
