import { PostActionEnum, workflow } from '@novu/framework';

import { LocalWorkflowExecutor } from './local-workflow-registry.service';

describe('LocalWorkflowExecutor', () => {
  let executor: LocalWorkflowExecutor;

  const testWorkflow = workflow(
    'test-workflow',
    async ({ step }) => {
      await step.email('send-email', async () => ({
        subject: 'Test Subject',
        body: 'Test Body',
      }));
    },
    {
      payloadSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    }
  );

  const anotherWorkflow = workflow('another-workflow', async ({ step }) => {
    await step.inApp('send-notification', async () => ({
      subject: 'Notification',
      body: 'Body content',
    }));
  });

  beforeEach(() => {
    executor = new LocalWorkflowExecutor();
  });

  describe('executeWorkflow', () => {
    it('should execute a workflow with the provided event', async () => {
      const result = await executor.executeWorkflow(testWorkflow, {
        workflowId: 'test-workflow',
        stepId: 'send-email',
        action: PostActionEnum.EXECUTE,
        payload: { name: 'Test' },
        controls: {},
        state: [],
        subscriber: {
          subscriberId: 'test-subscriber',
          email: 'test@example.com',
        },
        context: {},
      });

      expect(result).toBeDefined();
      expect(result.outputs).toBeDefined();
    });

    it('should create a new client for each execution (no shared state)', async () => {
      const result1 = await executor.executeWorkflow(testWorkflow, {
        workflowId: 'test-workflow',
        stepId: 'send-email',
        action: PostActionEnum.EXECUTE,
        payload: { name: 'First' },
        controls: {},
        state: [],
        subscriber: {
          subscriberId: 'subscriber-1',
          email: 'first@example.com',
        },
        context: {},
      });

      const result2 = await executor.executeWorkflow(anotherWorkflow, {
        workflowId: 'another-workflow',
        stepId: 'send-notification',
        action: PostActionEnum.EXECUTE,
        payload: {},
        controls: {},
        state: [],
        subscriber: {
          subscriberId: 'subscriber-2',
          email: 'second@example.com',
        },
        context: {},
      });

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should accept custom options', async () => {
      const result = await executor.executeWorkflow(
        testWorkflow,
        {
          workflowId: 'test-workflow',
          stepId: 'send-email',
          action: PostActionEnum.EXECUTE,
          payload: { name: 'Test' },
          controls: {},
          state: [],
          subscriber: {
            subscriberId: 'test-subscriber',
            email: 'test@example.com',
          },
          context: {},
        },
        {
          secretKey: 'custom-secret',
          strictAuthentication: false,
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe('previewWorkflow', () => {
    it('should preview a workflow', async () => {
      const result = await executor.previewWorkflow(testWorkflow, {
        workflowId: 'test-workflow',
        stepId: 'send-email',
        action: PostActionEnum.PREVIEW,
        payload: {},
        controls: {},
        state: [],
        subscriber: {
          subscriberId: 'test-subscriber',
          email: 'test@example.com',
        },
        context: {},
      });

      expect(result).toBeDefined();
      expect(result.outputs).toBeDefined();
    });

    it('should override event action to PREVIEW', async () => {
      const result = await executor.previewWorkflow(testWorkflow, {
        workflowId: 'test-workflow',
        stepId: 'send-email',
        action: PostActionEnum.EXECUTE,
        payload: {},
        controls: {},
        state: [],
        subscriber: {
          subscriberId: 'test-subscriber',
          email: 'test@example.com',
        },
        context: {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('multi-tenant isolation', () => {
    it('should not share state between different workflow executions', async () => {
      const tenant1Workflow = workflow('tenant-1-workflow', async ({ step }) => {
        await step.email('email', async () => ({
          subject: 'Tenant 1',
          body: 'Content for tenant 1',
        }));
      });

      const tenant2Workflow = workflow('tenant-2-workflow', async ({ step }) => {
        await step.email('email', async () => ({
          subject: 'Tenant 2',
          body: 'Content for tenant 2',
        }));
      });

      const result1 = await executor.executeWorkflow(tenant1Workflow, {
        workflowId: 'tenant-1-workflow',
        stepId: 'email',
        action: PostActionEnum.EXECUTE,
        payload: {},
        controls: {},
        state: [],
        subscriber: { subscriberId: 'tenant-1-user' },
        context: {},
      });

      const result2 = await executor.executeWorkflow(tenant2Workflow, {
        workflowId: 'tenant-2-workflow',
        stepId: 'email',
        action: PostActionEnum.EXECUTE,
        payload: {},
        controls: {},
        state: [],
        subscriber: { subscriberId: 'tenant-2-user' },
        context: {},
      });

      expect(result1.outputs).toEqual({ subject: 'Tenant 1', body: 'Content for tenant 1' });
      expect(result2.outputs).toEqual({ subject: 'Tenant 2', body: 'Content for tenant 2' });
    });
  });
});
