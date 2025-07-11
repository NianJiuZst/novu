import { ClassSerializerInterceptor, Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ExternalApiAccessible, UserSession } from '@novu/application-generic';
import { RequireAuthentication } from '../auth/framework/auth.decorator';
import type { GetRequestsDto } from './dtos/get-requests.dto';
import type { GetRequestsResponseDto } from './dtos/get-requests.response.dto';
import { GetRequestsCommand } from './usecases/get-requests/get-requests.command';
import type { GetRequests } from './usecases/get-requests/get-requests.usecase';

@Controller('/logs')
@UseInterceptors(ClassSerializerInterceptor)
@RequireAuthentication()
export class LogsController {
  constructor(private getRequestsUsecase: GetRequests) {}

  @Get('requests')
  @ExternalApiAccessible()
  async getLogs(
    @UserSession() user,
    @Query()
    query: GetRequestsDto
  ): Promise<GetRequestsResponseDto> {
    const command = GetRequestsCommand.create({
      organizationId: user.organizationId,
      userId: user._id,
      hoursAgo: query.created,
      ...query,
    });

    return this.getRequestsUsecase.execute(command);
  }
}
