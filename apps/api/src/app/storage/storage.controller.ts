import { ClassSerializerInterceptor, Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { IJwtPayload } from '@novu/shared';
import { GetSignedUrl } from './usecases/get-signed-url/get-signed-url.usecase';
import { GetSignedUrlCommand } from './usecases/get-signed-url/get-signed-url.command';
import { UserSession } from '../shared/framework/user.decorator';
import { UserAuthGuard } from '../auth/framework/user.auth.guard';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetSignedUrlResponseDto } from './dtos/get-signed-url-response.dto';
import { ExternalApiAccessible } from '../auth/framework/external-api.decorator';
import { ApiCommonResponses, ApiResponse } from '../shared/framework/response.decorator';

@ApiCommonResponses()
@Controller('/storage')
@ApiTags('Storage')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(UserAuthGuard)
@ApiExcludeController()
export class StorageController {
  constructor(private getSignedUrlUsecase: GetSignedUrl) {}

  @Get('/signed-url')
  @ApiOperation({
    summary: 'Get signed url for uploading or reading a file',
  })
  @ApiResponse(GetSignedUrlResponseDto)
  @ExternalApiAccessible()
  async signedUrl(
    @UserSession() user: IJwtPayload,
    @Query('operation') operation: 'read' | 'write',
    @Query('extension') extension?: string,
    @Query('imagePath') imagePath?: string
  ): Promise<GetSignedUrlResponseDto> {
    return await this.getSignedUrlUsecase.execute(
      GetSignedUrlCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        extension,
        operation,
        imagePath,
      })
    );
  }
}
