import { CreateWorkflowDto } from '@novu/api/models/components';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'events' | 'authentication' | 'social' | 'operational' | 'billing' | 'security';
  isPopular?: boolean;
  workflowDefinition: CreateWorkflowDto;
}

export type IWorkflowSuggestion = WorkflowTemplate;
