import { WorkflowTemplate } from '../templates/types';

function filterTemplates(templates: WorkflowTemplate[], category: string): WorkflowTemplate[] {
  if (category === 'popular') {
    return templates.filter((template) => template.isPopular);
  }

  if (category === 'stripe') {
    return templates.filter((template) => template.workflowDefinition.tags?.includes('stripe'));
  }

  if (category === 'clerk') {
    return templates.filter((template) => template.workflowDefinition.tags?.includes('clerk'));
  }

  return templates.filter((template) => template.category === category);
}
