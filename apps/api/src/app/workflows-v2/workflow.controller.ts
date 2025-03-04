import { ClassSerializerInterceptor, HttpStatus, Patch } from '@nestjs/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common/decorators';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DeleteWorkflowCommand,
  DeleteWorkflowUseCase,
  ExternalApiAccessible,
  UserSession,
} from '@novu/application-generic';
import {
  CreateWorkflowDto,
  DirectionEnum,
  GeneratePreviewRequestDto,
  GeneratePreviewResponseDto,
  GetListQueryParams,
  ListWorkflowResponse,
  PatchStepDataDto,
  PatchWorkflowDto,
  StepResponseDto,
  SyncWorkflowDto,
  UpdateWorkflowDto,
  UserSessionData,
  WorkflowOriginEnum,
  WorkflowResponseDto,
  WorkflowTestDataResponseDto,
} from '@novu/shared';
import { ApiCommonResponses } from '../shared/framework/response.decorator';
import { UserAuthentication } from '../shared/framework/swagger/api.key.security';
import { SdkMethodName } from '../shared/framework/swagger/sdk.decorators';
import { ParseSlugEnvironmentIdPipe } from './pipes/parse-slug-env-id.pipe';
import { ParseSlugIdPipe } from './pipes/parse-slug-id.pipe';
import {
  BuildStepDataCommand,
  BuildStepDataUsecase,
  BuildWorkflowTestDataUseCase,
  WorkflowTestDataCommand,
} from './usecases';
import { GeneratePreviewCommand } from './usecases/generate-preview/generate-preview.command';
import { GeneratePreviewUsecase } from './usecases/generate-preview/generate-preview.usecase';
import { GetWorkflowCommand } from './usecases/get-workflow/get-workflow.command';
import { GetWorkflowUseCase } from './usecases/get-workflow/get-workflow.usecase';
import { ListWorkflowsUseCase } from './usecases/list-workflows/list-workflow.usecase';
import { ListWorkflowsCommand } from './usecases/list-workflows/list-workflows.command';
import { PatchStepCommand } from './usecases/patch-step-data';
import { PatchStepUsecase } from './usecases/patch-step-data/patch-step.usecase';
import { PatchWorkflowCommand, PatchWorkflowUsecase } from './usecases/patch-workflow';
import { SyncToEnvironmentCommand } from './usecases/sync-to-environment/sync-to-environment.command';
import { SyncToEnvironmentUseCase } from './usecases/sync-to-environment/sync-to-environment.usecase';
import { UpsertWorkflowCommand } from './usecases/upsert-workflow/upsert-workflow.command';
import { UpsertWorkflowUseCase } from './usecases/upsert-workflow/upsert-workflow.usecase';

@ApiCommonResponses()
@Controller({ path: `/workflows`, version: '2' })
@UseInterceptors(ClassSerializerInterceptor)
@UserAuthentication()
@ApiTags('Workflows')
export class WorkflowController {
  constructor(
    private upsertWorkflowUseCase: UpsertWorkflowUseCase,
    private getWorkflowUseCase: GetWorkflowUseCase,
    private listWorkflowsUseCase: ListWorkflowsUseCase,
    private deleteWorkflowUsecase: DeleteWorkflowUseCase,
    private syncToEnvironmentUseCase: SyncToEnvironmentUseCase,
    private generatePreviewUseCase: GeneratePreviewUsecase,
    private buildWorkflowTestDataUseCase: BuildWorkflowTestDataUseCase,
    private buildStepDataUsecase: BuildStepDataUsecase,
    private patchStepDataUsecase: PatchStepUsecase,
    private patchWorkflowUsecase: PatchWorkflowUsecase
  ) {}

  @Post('')
  async create(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Body() createWorkflowDto: CreateWorkflowDto
  ): Promise<WorkflowResponseDto> {
    return this.upsertWorkflowUseCase.execute(
      UpsertWorkflowCommand.create({
        workflowDto: { ...createWorkflowDto, origin: WorkflowOriginEnum.NOVU_CLOUD },
        user,
      })
    );
  }

  @Put(':workflowId/sync')
  async sync(
    @UserSession() user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string,
    @Body() syncWorkflowDto: SyncWorkflowDto
  ): Promise<WorkflowResponseDto> {
    return this.syncToEnvironmentUseCase.execute(
      SyncToEnvironmentCommand.create({
        user,
        workflowIdOrInternalId,
        targetEnvironmentId: syncWorkflowDto.targetEnvironmentId,
      })
    );
  }

  @Put(':workflowId')
  async update(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto
  ): Promise<WorkflowResponseDto> {
    return await this.upsertWorkflowUseCase.execute(
      UpsertWorkflowCommand.create({
        workflowDto: updateWorkflowDto,
        user,
        workflowIdOrInternalId,
      })
    );
  }

  @Get(':workflowId')
  async getWorkflow(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string,
    @Query('environmentId') environmentId?: string
  ): Promise<WorkflowResponseDto> {
    return this.getWorkflowUseCase.execute(
      GetWorkflowCommand.create({
        workflowIdOrInternalId,
        user: {
          ...user,
          environmentId: environmentId || user.environmentId,
        },
      })
    );
  }

  @Delete(':workflowId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeWorkflow(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string
  ) {
    await this.deleteWorkflowUsecase.execute(
      DeleteWorkflowCommand.create({
        workflowIdOrInternalId,
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
      })
    );
  }

  @Get('')
  async searchWorkflows(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Query() query: GetListQueryParams
  ): Promise<ListWorkflowResponse> {
    return this.listWorkflowsUseCase.execute(
      ListWorkflowsCommand.create({
        offset: Number(query.offset || '0'),
        limit: Number(query.limit || '50'),
        orderDirection: query.orderDirection ?? DirectionEnum.DESC,
        orderBy: query.orderBy ?? 'createdAt',
        searchQuery: query.query,
        user,
      })
    );
  }

  @Post('/:workflowId/step/:stepId/preview')
  async generatePreview(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string,
    @Param('stepId', ParseSlugIdPipe) stepIdOrInternalId: string,
    @Body() generatePreviewRequestDto: GeneratePreviewRequestDto
  ): Promise<GeneratePreviewResponseDto> {
    return await this.generatePreviewUseCase.execute(
      GeneratePreviewCommand.create({
        user,
        workflowIdOrInternalId,
        stepIdOrInternalId,
        generatePreviewRequestDto,
      })
    );
  }

  @Get('/:workflowId/steps/:stepId')
  @SdkMethodName('getStepData')
  async getWorkflowStepData(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string,
    @Param('stepId', ParseSlugIdPipe) stepIdOrInternalId: string
  ): Promise<StepResponseDto> {
    return await this.buildStepDataUsecase.execute(
      BuildStepDataCommand.create({ user, workflowIdOrInternalId, stepIdOrInternalId })
    );
  }

  @Patch('/:workflowId/steps/:stepId')
  async patchWorkflowStepData(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string,
    @Param('stepId', ParseSlugIdPipe) stepIdOrInternalId: string,
    @Body() patchStepDataDto: PatchStepDataDto
  ): Promise<StepResponseDto> {
    return await this.patchStepDataUsecase.execute(
      PatchStepCommand.create({
        user,
        workflowIdOrInternalId,
        stepIdOrInternalId,
        ...patchStepDataDto,
      })
    );
  }

  @Patch('/:workflowId')
  async patchWorkflow(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string,
    @Body() patchWorkflowDto: PatchWorkflowDto
  ): Promise<WorkflowResponseDto> {
    return await this.patchWorkflowUsecase.execute(
      PatchWorkflowCommand.create({ user, workflowIdOrInternalId, ...patchWorkflowDto })
    );
  }

  @Get('/:workflowId/test-data')
  @SdkMethodName('getWorkflowTestData')
  async getWorkflowTestData(
    @UserSession() user: UserSessionData,
    @Param('workflowId', ParseSlugIdPipe) workflowIdOrInternalId: string
  ): Promise<WorkflowTestDataResponseDto> {
    return this.buildWorkflowTestDataUseCase.execute(
      WorkflowTestDataCommand.create({
        workflowIdOrInternalId,
        user,
      })
    );
  }

  @Post('/step-resolver-endpoint')
  @ApiOperation({
    summary: 'Set resolver endpoint for workflow steps',
    description: 'Configure external resolver endpoints for workflow steps',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            stepId: {
              type: 'string',
              description: 'The ID of the step to connect to the resolver endpoint',
            },
            endpoint: {
              type: 'string',
              description: 'The URL of the resolver endpoint',
            },
          },
          required: ['stepId', 'endpoint'],
        },
      },
      example: {
        '64a652d7450a561a767d9347': [
          {
            stepId: '64a652d7450a561a767d9348',
            endpoint: 'https://example.com/api/resolver',
          },
          {
            stepId: '64a652d7450a561a767d9349',
            endpoint: 'https://example.com/api/resolver2',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Resolver endpoints successfully connected to steps',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ExternalApiAccessible()
  async setStepResolverEndpoint(
    @UserSession(ParseSlugEnvironmentIdPipe) user: UserSessionData,
    @Body() stepResolverEndpointDto: Record<string, Array<{ stepId: string; endpoint: string }>>
  ): Promise<{ success: boolean }> {
    for (const [workflowId, stepConfigs] of Object.entries(stepResolverEndpointDto)) {
      for (const { stepId, endpoint } of stepConfigs) {
        console.log('workflowId', workflowId);
        console.log('stepId', stepId);
        console.log('endpoint', endpoint);

        await this.patchStepDataUsecase.execute({
          user,
          workflowIdOrInternalId: workflowId,
          stepIdOrInternalId: stepId,
          resolverEndpoint: endpoint,
        });
      }
    }

    return { success: true };
  }
}
