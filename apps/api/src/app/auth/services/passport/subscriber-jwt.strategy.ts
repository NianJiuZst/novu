import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ISubscriberJwt } from '@novu/shared';
import { IAuthService } from '@novu/application-generic';

@Injectable()
export class JwtSubscriberStrategy extends PassportStrategy(Strategy, 'subscriberJwt') {
  constructor(@Inject('AUTH_SERVICE') private readonly authService: IAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: ISubscriberJwt) {
    const subscriber = await this.authService.validateSubscriber(payload);

    if (!subscriber) {
      throw new UnauthorizedException();
    }

    if (payload.aud !== 'widget_user') {
      throw new UnauthorizedException();
    }

    return subscriber;
  }
}
