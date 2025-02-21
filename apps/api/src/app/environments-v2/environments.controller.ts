import { Body, ClassSerializerInterceptor, Controller, Get, Param, Put, UseInterceptors } from '@nestjs/common';
import { UserSessionData } from '@novu/shared';
import { ApiTags } from '@nestjs/swagger';
import { ApiExcludeController } from '@nestjs/swagger/dist/decorators/api-exclude-controller.decorator';
import { UserSession } from '../shared/framework/user.decorator';
import { GetEnvironmentTags, GetEnvironmentTagsCommand } from './usecases/get-environment-tags';
import { ExternalApiAccessible } from '../auth/framework/external-api.decorator';
import { ApiCommonResponses, ApiResponse } from '../shared/framework/response.decorator';
import { UserAuthentication } from '../shared/framework/swagger/api.key.security';
import { GetEnvironmentTagsDto } from './dtos/get-environment-tags.dto';
import { AddExternalAuthISsuerUrls, AddExternalAuthISsuerUrlsCommand } from './usecases/add-external-auth-issuer-urls';

@ApiCommonResponses()
@Controller({ path: `/environments`, version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
@UserAuthentication()
@ApiTags('Environments')
@ApiExcludeController()
export class EnvironmentsController {
  constructor(
    private getEnvironmentTagsUsecase: GetEnvironmentTags,
    private addExternalAuthISsuerUrls: AddExternalAuthISsuerUrls
  ) {}

  @Get('/:environmentId/tags')
  @ApiResponse(GetEnvironmentTagsDto)
  @ExternalApiAccessible()
  async getEnvironmentTags(
    @UserSession() user: UserSessionData,
    @Param('environmentId') environmentId: string
  ): Promise<GetEnvironmentTagsDto[]> {
    return await this.getEnvironmentTagsUsecase.execute(
      GetEnvironmentTagsCommand.create({
        environmentId,
        userId: user._id,
        organizationId: user.organizationId,
      })
    );
  }

  @Put('/:environmentId/external-auth-issuer-urls')
  @ExternalApiAccessible()
  async addExternalAuthIssuerUrls(
    @UserSession() user: UserSessionData,
    @Param('environmentId') environmentId: string,
    @Body() body: { externalAuthIssuerUrls: string[] }
  ): Promise<void> {
    return await this.addExternalAuthISsuerUrls.execute(
      AddExternalAuthISsuerUrlsCommand.create({
        environmentId,
        externalAuthIssuerUrls: body.externalAuthIssuerUrls,
        userId: user._id,
        organizationId: user.organizationId,
      })
    );
  }
}
