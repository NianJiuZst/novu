import * as esbuild from 'esbuild';
import { generateWorkerWrapper } from '../templates/worker-wrapper';
import type { DiscoveredStep, WorkflowBundle } from '../types';
import { getBundlerConfig } from './config';

const MAX_BUNDLE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

interface BundleBuildOptions {
  minify?: boolean;
}

export async function bundleWorkflow(
  workflowId: string,
  steps: DiscoveredStep[],
  environmentId: string,
  rootDir: string,
  options: BundleBuildOptions = {}
): Promise<WorkflowBundle> {
  // Generate the worker wrapper code
  const wrapperCode = generateWorkerWrapper(steps, workflowId, environmentId, rootDir);

  // Get base bundler config
  const baseConfig = getBundlerConfig({ minify: options.minify });

  // Bundle using esbuild with stdin
  const result = await esbuild.build({
    ...baseConfig,
    stdin: {
      contents: wrapperCode,
      loader: 'tsx',
      resolveDir: rootDir,
      sourcefile: `${workflowId}-worker.tsx`,
    },
    write: false,
    metafile: true,
  });

  const outputFile = result.outputFiles?.[0];

  if (!outputFile) {
    throw new Error(`No output from esbuild for workflow: ${workflowId}`);
  }

  const code = outputFile.text;
  const size = Buffer.byteLength(code, 'utf8');

  // Check bundle size
  if (size > MAX_BUNDLE_SIZE) {
    throw new Error(
      `Bundle too large: ${workflowId} workflow\n\n` +
        `   Bundle size: ${(size / 1024 / 1024).toFixed(1)} MB\n` +
        `   Maximum: ${MAX_BUNDLE_SIZE / 1024 / 1024} MB (Cloudflare limit)\n\n` +
        `Suggestions:\n` +
        `  • Split this workflow into multiple workflows\n` +
        `  • Reduce template complexity\n` +
        `  • Remove unused dependencies`
    );
  }

  return {
    workflowId,
    code,
    size,
    stepIds: steps.map((s) => s.stepId),
    steps,
  };
}

export async function bundleAllWorkflows(
  workflowSteps: Map<string, DiscoveredStep[]>,
  environmentId: string,
  rootDir: string,
  options: BundleBuildOptions = {}
): Promise<WorkflowBundle[]> {
  const bundles: WorkflowBundle[] = [];

  for (const [workflowId, steps] of workflowSteps.entries()) {
    const bundle = await bundleWorkflow(workflowId, steps, environmentId, rootDir, options);
    bundles.push(bundle);
  }

  return bundles;
}

export function formatBundleSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }
}
