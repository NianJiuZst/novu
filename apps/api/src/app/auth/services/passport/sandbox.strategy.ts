import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { IAuthService } from '@novu/application-generic';
import { ApiAuthSchemeEnum, UserSessionData, PassportStrategyEnum } from '@novu/shared';

class HeaderSandboxStrategy {
  name = PassportStrategyEnum.SANDBOX;

  constructor(
    private verifyCallback: (req: Request, done: (error: Error | null, user?: UserSessionData | false) => void) => void
  ) {}

  authenticate(req: Request): void {
    const done = (error: Error | null, user?: UserSessionData | false) => {
      if (error) {
        return this.error(error);
      }
      if (!user) {
        return this.fail(null);
      }
      this.success(user);
    };

    try {
      this.verifyCallback(req, done);
    } catch (error) {
      this.error(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Required Passport.js methods
  success(user: any): void {}
  fail(challenge: any): void {}
  error(err: Error): void {}
}

/**
 * Sandbox strategy implementation - only checks if the Authorization header is "Sandbox"
 */
@Injectable()
export class SandboxStrategy extends PassportStrategy(HeaderSandboxStrategy, PassportStrategyEnum.SANDBOX) {
  constructor(@Inject('AUTH_SERVICE') private authService: IAuthService) {
    super((req: Request, done: (error: Error | null, user?: UserSessionData | false) => void) => {
      // eslint-disable-next-line no-console
      console.log('req.headers ', req.headers);
      const authHeader = req.headers.authorization;
      const applicationIdentifier = req.headers['x-application-identifier'];

      // eslint-disable-next-line no-console
      console.log('authHeader ', authHeader);
      // eslint-disable-next-line no-console
      console.log('applicationIdentifier ', applicationIdentifier);

      if (authHeader === ApiAuthSchemeEnum.SANDBOX) {
        this.authService
          .getSandboxUser(applicationIdentifier as string | undefined)
          .then((user) => {
            done(null, user);
          })
          .catch((err) => done(err));
      } else {
        done(null, false);
      }
    });
  }
}
