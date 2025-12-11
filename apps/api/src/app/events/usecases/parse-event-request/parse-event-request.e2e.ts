import { Novu } from '@novu/api';
import { MessageRepository, SubscriberEntity, SubscriberRepository } from '@novu/dal';
import { StepTypeEnum, WorkflowCreationSourceEnum } from '@novu/shared';
import { SubscribersService, UserSession } from '@novu/testing';
import { expect } from 'chai';
import { initNovuClassSdk } from '../../../shared/helpers/e2e/sdk/e2e-sdk.helper';

describe('Trigger Event - Payload Validation - #novu-v2', () => {
  let session: UserSession;
  let subscribersService: SubscribersService;
  let subscriber: SubscriberEntity;
  let novuClient: Novu;
  const messageRepository = new MessageRepository();

  beforeEach(async () => {
    session = new UserSession();
    await session.initialize();

    subscribersService = new SubscribersService(session.organization._id, session.environment._id);
    subscriber = await subscribersService.createSubscriber();
    novuClient = initNovuClassSdk(session);
  });

  it('should throw exception when subscriber id sent as array', async () => {
    const { result: workflow } = await novuClient.workflows.create({
      name: 'Test Workflow - Array Validation',
      workflowId: `test-array-validation-${Date.now()}`,
      source: WorkflowCreationSourceEnum.DASHBOARD,
      active: true,
      steps: [
        {
          name: 'Email Step',
          type: StepTypeEnum.EMAIL,
          controlValues: {
            subject: 'Test email',
            body: 'Test body',
          },
        },
      ],
    });

    const subscriberId = [SubscriberRepository.createObjectId()];

    try {
      await novuClient.trigger({
        workflowId: workflow.workflowId,
        to: [{ subscriberId } as unknown as string],
        payload: {},
      });
      expect.fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.message).to.include(
        'subscriberId under property to is type array, which is not allowed please make sure all subscribers ids are strings'
      );
    }
  });

  it('should validate payload against schema when validatePayload is enabled', async () => {
    const { result: workflow } = await novuClient.workflows.create({
      name: 'Test Workflow - Payload Validation',
      workflowId: `test-payload-validation-${Date.now()}`,
      source: WorkflowCreationSourceEnum.DASHBOARD,
      active: true,
      validatePayload: true,
      payloadSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      },
      steps: [
        {
          name: 'Email Step',
          type: StepTypeEnum.EMAIL,
          controlValues: {
            subject: 'Hello {{payload.name}}',
            body: 'You are {{payload.age}} years old',
          },
        },
      ],
    });

    try {
      await novuClient.trigger({
        workflowId: workflow.workflowId,
        to: [subscriber.subscriberId],
        payload: { age: 25 },
      });
      expect.fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.message).to.include('Payload validation failed');
      expect(error.body).to.exist;
      expect(error.body.type).to.equal('PAYLOAD_VALIDATION_ERROR');
      expect(error.body.errors).to.be.an('array');
      expect(error.body.errors).to.have.length.greaterThan(0);
      expect(error.body.errors[0]).to.have.property('field');
      expect(error.body.errors[0]).to.have.property('message');
      expect(error.body.errors[0].field).to.include('name');
    }
  });

  it('should pass validation when payload matches schema', async () => {
    const { result: workflow } = await novuClient.workflows.create({
      name: 'Test Workflow - Valid Payload',
      workflowId: `test-valid-payload-${Date.now()}`,
      source: WorkflowCreationSourceEnum.DASHBOARD,
      active: true,
      validatePayload: true,
      payloadSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      },
      steps: [
        {
          name: 'Email Step',
          type: StepTypeEnum.EMAIL,
          controlValues: {
            subject: 'Hello {{payload.name}}',
            body: 'You are {{payload.age}} years old',
          },
        },
      ],
    });

    const response = await novuClient.trigger({
      workflowId: workflow.workflowId,
      to: [subscriber.subscriberId],
      payload: { name: 'John Doe', age: 25 },
    });

    expect(response).to.exist;
    expect(response.result.acknowledged).to.be.true;
    expect(response.result.status).to.equal('processed');
  });

  it('should skip validation when validatePayload is disabled', async () => {
    const { result: workflow } = await novuClient.workflows.create({
      name: 'Test Workflow - No Validation',
      workflowId: `test-no-validation-${Date.now()}`,
      source: WorkflowCreationSourceEnum.DASHBOARD,
      active: true,
      validatePayload: false,
      payloadSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      },
      steps: [
        {
          name: 'Email Step',
          type: StepTypeEnum.EMAIL,
          controlValues: {
            subject: 'Test email',
            body: 'Test body',
          },
        },
      ],
    });

    const response = await novuClient.trigger({
      workflowId: workflow.workflowId,
      to: [subscriber.subscriberId],
      payload: { invalidField: 'value' },
    });

    expect(response).to.exist;
    expect(response.result.acknowledged).to.be.true;
  });

  it('should apply default values from schema when validatePayload is enabled', async () => {
    const { result: workflow } = await novuClient.workflows.create({
      name: 'Test Workflow - Default Values',
      workflowId: `test-default-values-${Date.now()}`,
      source: WorkflowCreationSourceEnum.DASHBOARD,
      active: true,
      validatePayload: true,
      payloadSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', default: 'Default Name' },
          age: { type: 'number', default: 30 },
          isActive: { type: 'boolean', default: true },
        },
        required: [],
      },
      steps: [
        {
          name: 'Email Step',
          type: StepTypeEnum.EMAIL,
          controlValues: {
            subject: 'Hello {{payload.name}}',
            body: 'Age: {{payload.age}}, Active: {{payload.isActive}}',
          },
        },
      ],
    });

    const response = await novuClient.trigger({
      workflowId: workflow.workflowId,
      to: [subscriber.subscriberId],
      payload: { name: 'John Doe' },
    });

    expect(response).to.exist;
    expect(response.result.acknowledged).to.be.true;

    await session.waitForJobCompletion(workflow.id);

    const messages = await messageRepository.find({
      _environmentId: session.environment._id,
      _subscriberId: subscriber._id,
    });

    expect(messages.length).to.equal(1);
    expect(messages[0].subject).to.equal('Hello John Doe');
    expect(messages[0].content).to.include('Age: 30');
    expect(messages[0].content).to.include('Active: true');
  });

  it('should not override provided values with defaults', async () => {
    const { result: workflow } = await novuClient.workflows.create({
      name: 'Test Workflow - No Override',
      workflowId: `test-no-override-${Date.now()}`,
      source: WorkflowCreationSourceEnum.DASHBOARD,
      active: true,
      validatePayload: true,
      payloadSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', default: 'Default Name' },
          age: { type: 'number', default: 30 },
          isActive: { type: 'boolean', default: true },
        },
        required: [],
      },
      steps: [
        {
          name: 'Email Step',
          type: StepTypeEnum.EMAIL,
          controlValues: {
            subject: 'Hello {{payload.name}}',
            body: 'Age: {{payload.age}}, Active: {{payload.isActive}}',
          },
        },
      ],
    });

    const response = await novuClient.trigger({
      workflowId: workflow.workflowId,
      to: [subscriber.subscriberId],
      payload: { name: 'Jane Doe', age: 25, isActive: false },
    });

    expect(response).to.exist;
    expect(response.result.acknowledged).to.be.true;

    await session.waitForJobCompletion(workflow.id);

    const messages = await messageRepository.find({
      _environmentId: session.environment._id,
      _subscriberId: subscriber._id,
    });

    expect(messages.length).to.equal(1);
    expect(messages[0].subject).to.equal('Hello Jane Doe');
    expect(messages[0].content).to.include('Age: 25');
    expect(messages[0].content).to.include('Active: false');
  });
});
