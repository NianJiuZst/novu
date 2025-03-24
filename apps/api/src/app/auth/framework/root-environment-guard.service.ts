import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IAuthService } from '@novu/application-generic';

@Injectable()
export class RootEnvironmentGuard implements CanActivate {
  constructor(@Inject('AUTH_SERVICE') private authService: IAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    const environment = await this.authService.isRootEnvironment(user);

    // eslint-disable-next-line no-console
    console.log('Root environment guard ', environment);

    if (environment) {
      throw new UnauthorizedException('This action is only allowed in Development environment');
    }

    return true;
  }
}
