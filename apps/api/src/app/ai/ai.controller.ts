import { Body, ClassSerializerInterceptor, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiExcludeController, ApiOperation } from '@nestjs/swagger';
import { UserSessionData } from '@novu/shared';
import { RequireAuthentication } from '../auth/framework/auth.decorator';
import { ApiCommonResponses, ApiResponse } from '../shared/framework/response.decorator';
import { UserSession } from '../shared/framework/user.decorator';
import { GenerateContentRequestDto, GenerateContentResponseDto } from './dtos';
import { GenerateContentCommand, GenerateContentUseCase } from './usecases/generate-content';

@ApiCommonResponses()
@ApiExcludeController()
@Controller({ path: '/ai', version: '1' })
@UseInterceptors(ClassSerializerInterceptor)
@RequireAuthentication()
export class AiController {
  constructor(private generateContentUseCase: GenerateContentUseCase) {}

  @Post('/content/generate')
  @ApiOperation({
    summary: 'Generate step content using AI',
    description:
      'Generate notification content for a specific channel type (email, SMS, push, in-app, chat) using AI based on user prompts.',
  })
  @ApiResponse(GenerateContentResponseDto)
  async generateContent(
    @UserSession() user: UserSessionData,
    @Body() body: GenerateContentRequestDto
  ): Promise<GenerateContentResponseDto> {
    return this.generateContentUseCase.execute(
      GenerateContentCommand.create({
        stepType: body.stepType,
        messages: body.messages,
        context: body.context,
        organizationId: user.organizationId,
        environmentId: user.environmentId,
        userId: user._id,
      })
    );
  }
}
