import axios from 'axios';
import FormData from 'form-data';
import type { DeploymentResult, EnvironmentInfo, WorkflowBundle } from '../types';

export class StepResolverClient {
  constructor(
    private apiUrl: string,
    private secretKey: string
  ) {}

  private getAuthHeaders() {
    return {
      Authorization: `ApiKey ${this.secretKey}`,
    };
  }

  async validateConnection(): Promise<void> {
    try {
      await axios.get(`${this.apiUrl}/v1/users/me`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your secret key.');
        }
        throw new Error(`Connection failed: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    try {
      const response = await axios.get(`${this.apiUrl}/v1/environments/me`, {
        headers: this.getAuthHeaders(),
      });

      const envData = response.data.data;

      return {
        _id: envData._id,
        name: envData.name,
        _organizationId: envData._organizationId,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your secret key.');
        }
        if (error.response?.status === 404) {
          throw new Error('Environment not found. Please ensure your API key has proper permissions.');
        }
        throw new Error(`Failed to fetch environment: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async deployWorkflow(bundle: WorkflowBundle): Promise<DeploymentResult> {
    try {
      const formData = new FormData();
      formData.append('workflowId', bundle.workflowId);
      formData.append('bundle', Buffer.from(bundle.code, 'utf8'), {
        filename: 'worker.mjs',
        contentType: 'application/javascript+module',
      });

      const response = await axios.post(`${this.apiUrl}/v2/step-resolvers/deploy`, formData, {
        headers: {
          ...this.getAuthHeaders(),
          ...formData.getHeaders(),
        },
        // Limit is enforced on the server side
        maxBodyLength: Infinity,
      });

      const data = response.data.data;

      return {
        workflowId: bundle.workflowId,
        workerId: data.workerId || bundle.workflowId,
        deployedAt: data.deployedAt || new Date().toISOString(),
        stepIds: bundle.stepIds,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your secret key.');
        }
        if (error.response?.status === 400) {
          const apiMessage = error.response?.data?.message || error.response?.data?.error || 'Invalid request';
          throw new Error(`Bad request: ${apiMessage}`);
        }
        if (error.response?.status === 404) {
          throw new Error(
            `Workflow not found: ${bundle.workflowId}. Make sure the workflow exists in your environment.`
          );
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.response?.status >= 500) {
          throw new Error(
            `Server error (${error.response.status}): ${error.response?.data?.message || 'Internal server error'}`
          );
        }

        const apiMessage =
          error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
        throw new Error(`Deployment failed (${error.response?.status || 'unknown'}): ${apiMessage}`);
      }

      if (error instanceof Error) {
        throw new Error(`Network error: ${error.message}`);
      }

      throw new Error('Unknown deployment error occurred');
    }
  }
}
