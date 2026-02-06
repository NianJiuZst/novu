export interface DiscoveredStep {
  stepId: string;
  workflowId: string;
  type: string;
  filePath: string;
  relativePath: string;
}

export interface ValidationError {
  filePath: string;
  errors: string[];
}

export interface StepDiscoveryResult {
  valid: boolean;
  matchedFiles: number;
  steps: DiscoveredStep[];
  errors: ValidationError[];
}

export interface WorkflowBundle {
  workflowId: string;
  code: string;
  size: number;
  stepIds: string[];
  steps: DiscoveredStep[];
}

export interface DeploymentResult {
  workflowId: string;
  workerId: string;
  deployedAt: string;
  version: string;
  stepIds: string[];
}

export interface EnvironmentInfo {
  _id: string;
  name: string;
  _organizationId: string;
}
