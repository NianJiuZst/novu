import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@novu/application-generic';
import { PermissionsEnum, UserSessionData } from '@novu/shared';
import { RequireAuthentication } from '../auth/framework/auth.decorator';
import { ExternalApiAccessible } from '../auth/framework/external-api.decorator';
import { ApiCommonResponses, ApiResponse } from '../shared/framework/response.decorator';
import { UserSession } from '../shared/framework/user.decorator';
import { AgentResponseDto, CreateAgentRequestDto, DeleteAgentResponseDto, UpdateAgentRequestDto } from './dtos';
import { CreateAgentCommand } from './usecases/create-agent/create-agent.command';
import { CreateAgent } from './usecases/create-agent/create-agent.usecase';
import { DeleteAgentCommand } from './usecases/delete-agent/delete-agent.command';
import { DeleteAgent } from './usecases/delete-agent/delete-agent.usecase';
import { GetAgentCommand } from './usecases/get-agent/get-agent.command';
import { GetAgent } from './usecases/get-agent/get-agent.usecase';
import { ListAgentsCommand } from './usecases/list-agents/list-agents.command';
import { ListAgents } from './usecases/list-agents/list-agents.usecase';
import { UpdateAgentCommand } from './usecases/update-agent/update-agent.command';
import { UpdateAgent } from './usecases/update-agent/update-agent.usecase';

@ApiCommonResponses()
@Controller('/agents')
@UseInterceptors(ClassSerializerInterceptor)
@RequireAuthentication()
@ApiTags('Agents')
@ApiExcludeController()
export class AgentsController {
  constructor(
    private listAgentsUsecase: ListAgents,
    private createAgentUsecase: CreateAgent,
    private getAgentUsecase: GetAgent,
    private updateAgentUsecase: UpdateAgent,
    private deleteAgentUsecase: DeleteAgent
  ) {}

  @Post('')
  @ExternalApiAccessible()
  @ApiResponse(AgentResponseDto, 201)
  @ApiOperation({
    summary: 'Create agent',
  })
  @RequirePermissions(PermissionsEnum.WORKFLOW_WRITE)
  createAgent(@UserSession() user: UserSessionData, @Body() body: CreateAgentRequestDto): Promise<AgentResponseDto> {
    return this.createAgentUsecase.execute(
      CreateAgentCommand.create({
        organizationId: user.organizationId,
        userId: user._id,
        environmentId: user.environmentId,
        name: body.name,
        identifier: body.identifier,
      })
    );
  }

  @Get('')
  @ExternalApiAccessible()
  @ApiResponse(AgentResponseDto, 200, true)
  @ApiOperation({
    summary: 'List agents',
  })
  @RequirePermissions(PermissionsEnum.WORKFLOW_READ)
  listAgents(@UserSession() user: UserSessionData): Promise<AgentResponseDto[]> {
    return this.listAgentsUsecase.execute(
      ListAgentsCommand.create({
        organizationId: user.organizationId,
        userId: user._id,
        environmentId: user.environmentId,
      })
    );
  }

  @Get('/:agentId')
  @ExternalApiAccessible()
  @ApiResponse(AgentResponseDto, 200)
  @ApiOperation({
    summary: 'Get agent',
  })
  @RequirePermissions(PermissionsEnum.WORKFLOW_READ)
  getAgent(@UserSession() user: UserSessionData, @Param('agentId') agentId: string): Promise<AgentResponseDto> {
    return this.getAgentUsecase.execute(
      GetAgentCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        agentId,
      })
    );
  }

  @Patch('/:agentId')
  @ExternalApiAccessible()
  @ApiResponse(AgentResponseDto, 200)
  @ApiOperation({
    summary: 'Update agent',
  })
  @RequirePermissions(PermissionsEnum.WORKFLOW_WRITE)
  updateAgent(
    @UserSession() user: UserSessionData,
    @Param('agentId') agentId: string,
    @Body() body: UpdateAgentRequestDto
  ): Promise<AgentResponseDto> {
    return this.updateAgentUsecase.execute(
      UpdateAgentCommand.create({
        organizationId: user.organizationId,
        userId: user._id,
        environmentId: user.environmentId,
        agentId,
        name: body.name,
        identifier: body.identifier,
        integrationIds: body.integrationIds,
      })
    );
  }

  @Delete('/:agentId')
  @ExternalApiAccessible()
  @ApiResponse(DeleteAgentResponseDto, 200)
  @ApiOperation({
    summary: 'Delete agent',
  })
  @RequirePermissions(PermissionsEnum.WORKFLOW_WRITE)
  deleteAgent(
    @UserSession() user: UserSessionData,
    @Param('agentId') agentId: string
  ): Promise<DeleteAgentResponseDto> {
    return this.deleteAgentUsecase.execute(
      DeleteAgentCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        agentId,
      })
    );
  }
}
