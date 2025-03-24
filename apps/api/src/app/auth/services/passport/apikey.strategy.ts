import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { HttpRequestHeaderKeysEnum, IAuthService } from '@novu/application-generic';
import { ApiAuthSchemeEnum, UserSessionData } from '@novu/shared';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(@Inject('AUTH_SERVICE') private readonly authService: IAuthService) {
    super(
      { header: HttpRequestHeaderKeysEnum.AUTHORIZATION, prefix: `${ApiAuthSchemeEnum.API_KEY} ` },
      true,
      (apikey: string, verified: (err: Error | null, user?: UserSessionData | false) => void) => {
        this.authService
          .getUserByApiKey(apikey)
          .then((user) => {
            if (!user) {
              return verified(null, false);
            }

            return verified(null, user);
          })
          .catch((err) => verified(err, false));
      }
    );
  }
}
