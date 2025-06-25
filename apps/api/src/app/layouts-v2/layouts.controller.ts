import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonResponses,
  ApiResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '../shared/framework/response.decorator';
import { IJwtPayload } from '@novu/shared';
import { GetLayoutCommand, GetLayoutUseCase, OtelSpan } from '@novu/application-generic';

import { DeleteLayoutCommand, DeleteLayoutUseCase } from '../layouts/usecases';
import { DuplicateLayoutUseCase } from './usecases';
import { DuplicateLayoutCommand } from './usecases/duplicate-layout/duplicate-layout.command';
import { DuplicateLayoutRequestDto, DuplicateLayoutResponseDto, GetLayoutResponseDto } from './dtos';
import { LayoutId } from '../layouts/types';

import { UserAuthGuard } from '../auth/framework/user.auth.guard';
import { ExternalApiAccessible } from '../auth/framework/external-api.decorator';
import { UserSession } from '../shared/framework/user.decorator';

@ApiCommonResponses()
@Controller('/v2/layouts')
@ApiTags('Layouts V2')
@UseGuards(UserAuthGuard)
export class LayoutsV2Controller {
  constructor(
    private getLayoutUseCase: GetLayoutUseCase,
    private deleteLayoutUseCase: DeleteLayoutUseCase,
    private duplicateLayoutUseCase: DuplicateLayoutUseCase
  ) {}

  @Get('/:layoutId')
  @ExternalApiAccessible()
  @ApiResponse(GetLayoutResponseDto)
  @ApiNotFoundResponse({
    description: 'The layout with the layoutId provided does not exist in the database.',
  })
  @ApiOperation({ summary: 'Get layout', description: 'Get a layout by its ID' })
  @OtelSpan()
  async getLayout(
    @UserSession() user: IJwtPayload,
    @Param('layoutId') layoutId: LayoutId
  ): Promise<GetLayoutResponseDto> {
    Logger.verbose(`Getting layout ${layoutId}`);

    return await this.getLayoutUseCase.execute(
      GetLayoutCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        layoutId,
      })
    );
  }

  @Delete('/:layoutId')
  @ExternalApiAccessible()
  @ApiNoContentResponse({
    description: 'The layout has been deleted correctly',
  })
  @ApiNotFoundResponse({
    description: 'The layout with the layoutId provided does not exist in the database so it can not be deleted.',
  })
  @ApiConflictResponse({
    description:
      'Either you are trying to delete a layout that is being used or a layout that is the default in the environment.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete layout', description: 'Execute a soft delete of a layout given a certain ID.' })
  @OtelSpan()
  async deleteLayout(@UserSession() user: IJwtPayload, @Param('layoutId') layoutId: LayoutId): Promise<void> {
    Logger.verbose(`Deleting layout ${layoutId}`);

    return await this.deleteLayoutUseCase.execute(
      DeleteLayoutCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        layoutId,
      })
    );
  }

  @Post('/:layoutId/duplicate')
  @ExternalApiAccessible()
  @ApiResponse(DuplicateLayoutResponseDto, 201)
  @ApiNotFoundResponse({
    description: 'The layout with the layoutId provided does not exist in the database.',
  })
  @ApiOperation({ summary: 'Duplicate layout', description: 'Create a copy of an existing layout' })
  @OtelSpan()
  async duplicateLayout(
    @UserSession() user: IJwtPayload,
    @Param('layoutId') layoutId: LayoutId,
    @Body() body: DuplicateLayoutRequestDto
  ): Promise<DuplicateLayoutResponseDto> {
    Logger.verbose(`Duplicating layout ${layoutId}`);

    const duplicatedLayout = await this.duplicateLayoutUseCase.execute(
      DuplicateLayoutCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        sourceLayoutId: layoutId,
        name: body.name,
        identifier: body.identifier,
      })
    );

    Logger.verbose(`Duplicated layout to ${duplicatedLayout._id}`);

    return {
      _id: duplicatedLayout._id,
    };
  }
}
