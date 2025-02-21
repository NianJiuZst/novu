import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserSessionData } from '@novu/shared';
import { ApiTags } from '@nestjs/swagger';
import { UserSession } from '../shared/framework/user.decorator';
import { GetEnvironmentTags, GetEnvironmentTagsCommand } from './usecases/get-environment-tags';
import { ExternalApiAccessible } from '../auth/framework/external-api.decorator';
import { ApiCommonResponses, ApiResponse } from '../shared/framework/response.decorator';
import { UserAuthentication } from '../shared/framework/swagger/api.key.security';
import { GetEnvironmentTagsDto } from './dtos/get-environment-tags.dto';
import { CommunityUserAuthGuard } from '../auth/framework/community.user.auth.guard';
import { SessionGeneratedResponseDto } from './SessionGeneratedResponseDto';
import { GenerateJwtUsecase } from './generateJwtUsecase';
import { SdkMethodName } from '../shared/framework/swagger/sdk.decorators';
import { AddExternalAuthISsuerUrls, AddExternalAuthISsuerUrlsCommand } from './usecases/add-external-auth-issuer-urls';

@ApiCommonResponses()
@Controller({ path: `/environments`, version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
@UserAuthentication()
@ApiTags('Environments')
export class EnvironmentsController {
  constructor(
    private getEnvironmentTagsUsecase: GetEnvironmentTags,
    private generateJwtUseCase: GenerateJwtUsecase,
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

  @Post('/session/:subscriberId')
  @ApiResponse(SessionGeneratedResponseDto, 201, false)
  @UseGuards(CommunityUserAuthGuard)
  @SdkMethodName('generateSession')
  @ExternalApiAccessible()
  async generateSession(
    @UserSession() user: UserSessionData,
    @Param('subscriberId') subscriberId: string
  ): Promise<SessionGeneratedResponseDto> {
    const jwt = await this.generateJwtUseCase.execute({ user, subscriberId });

    return { jwt };
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
