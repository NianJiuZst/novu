import { Injectable } from '@nestjs/common';
import { NotificationStepEntity, NotificationTemplateEntity } from '@novu/dal';
import { JSONSchemaDto, StepTypeEnum, UserSessionData, WorkflowTestDataResponseDto, Variables } from '@novu/shared';
import {
  GetWorkflowByIdsCommand,
  GetWorkflowByIdsUseCase,
  Instrument,
  InstrumentUsecase,
} from '@novu/application-generic';
import { WorkflowTestDataCommand } from './build-workflow-test-data.command';
import { parsePayloadSchema } from '../../shared/parse-payload-schema';
import { mockSchemaDefaults } from '../../util/utils';
import { ExtractVariables } from '../extract-variables/extract-variables.usecase';
import { ExtractVariablesCommand } from '../extract-variables/extract-variables.command';
import { buildVariablesSchema } from '../../util/create-schema';

@Injectable()
export class BuildWorkflowTestDataUseCase {
  constructor(
    private readonly getWorkflowByIdsUseCase: GetWorkflowByIdsUseCase,
    private readonly extractVariables: ExtractVariables
  ) {}

  @InstrumentUsecase()
  async execute(command: WorkflowTestDataCommand): Promise<WorkflowTestDataResponseDto> {
    const workflow = await this.fetchWorkflow(command);
    const variables = await this.extractVariables.execute(
      ExtractVariablesCommand.create({
        environmentId: command.user.environmentId,
        organizationId: command.user.organizationId,
        userId: command.user._id,
        workflowId: workflow._id,
      })
    );
    const toSchema = this.buildToFieldSchema({ user: command.user, steps: workflow.steps, variables });

    const payloadSchema = await this.resolvePayloadSchema(workflow, command);
    const payloadSchemaMock = this.generatePayloadMock(payloadSchema);

    return {
      to: toSchema,
      payload: payloadSchemaMock,
    };
  }

  @Instrument()
  private async resolvePayloadSchema(
    workflow: NotificationTemplateEntity,
    command: WorkflowTestDataCommand
  ): Promise<JSONSchemaDto> {
    if (workflow.payloadSchema) {
      return parsePayloadSchema(workflow.payloadSchema, { safe: true }) || {};
    }

    const { payload } = await this.extractVariables.execute(
      ExtractVariablesCommand.create({
        environmentId: command.user.environmentId,
        organizationId: command.user.organizationId,
        userId: command.user._id,
        workflowId: workflow._id,
      })
    );

    return buildVariablesSchema(payload);
  }

  private generatePayloadMock(schema: JSONSchemaDto): Record<string, unknown> {
    if (!schema?.properties || Object.keys(schema.properties).length === 0) {
      return {};
    }

    return mockSchemaDefaults(schema);
  }

  @Instrument()
  private async fetchWorkflow(command: WorkflowTestDataCommand): Promise<NotificationTemplateEntity> {
    return this.getWorkflowByIdsUseCase.execute(
      GetWorkflowByIdsCommand.create({
        environmentId: command.user.environmentId,
        organizationId: command.user.organizationId,
        userId: command.user._id,
        workflowIdOrInternalId: command.workflowIdOrInternalId,
      })
    );
  }

  private buildToFieldSchema({
    user,
    steps,
    variables,
  }: {
    user: UserSessionData;
    steps: NotificationStepEntity[];
    variables: Variables;
  }): JSONSchemaDto {
    // TODO: add subscriber schema
    const toSchema = buildVariablesSchema({});

    const required: string[] = ['subscriberId'];
    toSchema.properties!.subscriberId = { type: 'string', default: user._id };

    if (this.hasStep(steps, StepTypeEnum.EMAIL)) {
      toSchema.properties!.email = { type: 'string', default: user.email ?? '', format: 'email' };
      required.push('email');
    }

    if (this.hasStep(steps, StepTypeEnum.SMS)) {
      toSchema.properties!.phone = { type: 'string', default: '' };
      required.push('phone');
    }
    console.log({
      variables,
    });
    if (variables.subscriber.firstName) {
      toSchema.properties!.firstName = { type: 'string', default: user?.firstName || '' };
    }

    if (variables.subscriber.lastName) {
      toSchema.properties!.lastName = { type: 'string', default: user?.lastName || '' };
    }

    if (variables.subscriber.isOnline) {
      toSchema.properties!.isOnline = { type: 'boolean', default: true };
    }

    if (variables.subscriber.lastOnlineAt) {
      toSchema.properties!.lastOnlineAt = { type: 'string', format: 'date-time', default: new Date().toISOString() };
    }

    // TODO: add locale as an enum
    if (variables.subscriber.locale) {
      toSchema.properties!.locale = { type: 'string', default: '' };
    }

    // TODO: add timezone as an enum
    if (variables.subscriber.timezone) {
      toSchema.properties!.timezone = { type: 'string', default: '' };
    }

    return toSchema;
  }

  private hasStep(steps: NotificationStepEntity[], type: StepTypeEnum): boolean {
    return steps.some((step) => step.template?.type === type);
  }
}

enum Test {
  a = 'a',
  b = 'b',
}
