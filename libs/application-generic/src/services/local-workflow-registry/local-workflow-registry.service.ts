import { Injectable, Logger } from '@nestjs/common';
import { Client, Event, ExecuteOutput, PostActionEnum, Workflow } from '@novu/framework';

const LOG_CONTEXT = 'LocalWorkflowExecutor';

export interface LocalWorkflowExecutorOptions {
  secretKey?: string;
  strictAuthentication?: boolean;
}

@Injectable()
export class LocalWorkflowExecutor {
  async executeWorkflow(
    workflow: Workflow,
    event: Event,
    options?: LocalWorkflowExecutorOptions
  ): Promise<ExecuteOutput> {
    const client = this.createClient(options);

    Logger.debug(`Executing workflow '${workflow.id}' locally (no HTTP)`, LOG_CONTEXT);

    await client.addWorkflows([workflow]);

    return client.executeWorkflow(event);
  }

  async previewWorkflow(
    workflow: Workflow,
    event: Event,
    options?: LocalWorkflowExecutorOptions
  ): Promise<ExecuteOutput> {
    const client = this.createClient(options);

    Logger.debug(`Previewing workflow '${workflow.id}' locally (no HTTP)`, LOG_CONTEXT);

    await client.addWorkflows([workflow]);

    const previewEvent: Event = {
      ...event,
      action: PostActionEnum.PREVIEW,
    };

    return client.executeWorkflow(previewEvent);
  }

  private createClient(options?: LocalWorkflowExecutorOptions): Client {
    return new Client({
      secretKey: options?.secretKey || process.env.NOVU_SECRET_KEY || '',
      strictAuthentication: options?.strictAuthentication ?? false,
    });
  }
}
