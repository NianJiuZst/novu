import { describe, expect, it } from 'vitest';
import type { DiscoveredStep } from '../types';
import { generateWorkerWrapper } from './worker-wrapper';

describe('generateWorkerWrapper', () => {
  const mockSteps: DiscoveredStep[] = [
    {
      stepId: 'welcome-email',
      workflowId: 'onboarding',
      type: 'email',
      filePath: '/root/novu/welcome-email.step.tsx',
      relativePath: 'welcome-email.step.tsx',
    },
    {
      stepId: 'verify-email',
      workflowId: 'onboarding',
      type: 'email',
      filePath: '/root/novu/verify-email.step.tsx',
      relativePath: 'verify-email.step.tsx',
    },
  ];

  it('should match snapshot', () => {
    const result = generateWorkerWrapper(mockSteps, 'onboarding', 'env-123', '/root');
    expect(result).toMatchSnapshot();
  });

  it('should handle empty steps array', () => {
    const result = generateWorkerWrapper([], 'workflow', 'env', '/root');
    expect(result).toMatchSnapshot('empty-steps');
  });

  it('should handle single step', () => {
    const result = generateWorkerWrapper([mockSteps[0]], 'workflow', 'env', '/root');
    expect(result).toMatchSnapshot('single-step');
  });

  it('should interpolate workflow and environment IDs', () => {
    const result = generateWorkerWrapper(mockSteps, 'my-workflow', 'my-env', '/root');

    expect(result).toContain("workflowId: 'my-workflow'");
    expect(result).toContain("environmentId: 'my-env'");
  });
});
