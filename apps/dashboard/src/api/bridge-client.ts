import type { DiscoverWorkflowOutput, HealthCheck } from '@novu/framework/internal';
import axios from 'axios';

export function buildBridgeHTTPClient(baseURL: string) {
  const httpClient = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': true,
    },
  });

  const get = async (url: string, params = {}) => {
    try {
      const response = await httpClient.get(url, { params });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return {
    async discover(): Promise<{ workflows: DiscoverWorkflowOutput[] }> {
      return get('', {
        action: 'discover',
      });
    },

    async healthCheck(): Promise<HealthCheck> {
      return get('', {
        action: 'health-check',
      });
    },

    async getWorkflow(workflowId: string): Promise<DiscoverWorkflowOutput> {
      const { workflows } = await this.discover();
      const workflow = workflows.find((workflow) => workflow.workflowId === workflowId);

      if (!workflow) {
        throw new Error(`Workflow with id ${workflowId} not found`);
      }

      return workflow;
    },
  };
}
