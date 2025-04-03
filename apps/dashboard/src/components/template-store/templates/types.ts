import { CreateWorkflowDto } from '@novu/shared';
import { IntegrationType } from '../../icons/integrations';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'events' | 'authentication' | 'social' | 'operational' | 'billing' | 'security';
  isPopular?: boolean;
  workflowDefinition: CreateWorkflowDto;
  integration?: IntegrationType;
}

export type IWorkflowSuggestion = WorkflowTemplate;
