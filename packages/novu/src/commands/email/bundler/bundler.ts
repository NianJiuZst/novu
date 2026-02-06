import * as esbuild from 'esbuild';
import { generateWorkerWrapper } from '../templates/worker-wrapper';
import type { DiscoveredStep, WorkflowBundle } from '../types';
import { getBundlerConfig } from './config';

const MAX_BUNDLE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

interface BundleBuildOptions {
  minify?: boolean;
  aliases?: Record<string, string>;
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
  const baseConfig = getBundlerConfig({
    rootDir,
    minify: options.minify,
    aliases: options.aliases,
  });

  // Bundle using esbuild with stdin
  let result: esbuild.BuildResult;

  try {
    result = await esbuild.build({
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
  } catch (error) {
    throw formatBundlingError(workflowId, error);
  }

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

function formatBundlingError(workflowId: string, error: unknown): Error {
  if (isBuildFailure(error)) {
    const unresolvedImports = error.errors.filter((entry) => entry.text.includes('Could not resolve'));
    if (unresolvedImports.length > 0) {
      const details = unresolvedImports
        .map((entry) => {
          if (!entry.location) {
            return entry.text;
          }

          return `${entry.text} (${entry.location.file}:${entry.location.line}:${entry.location.column})`;
        })
        .join('\n  • ');

      return new Error(
        `Failed to bundle workflow: ${workflowId}\n\n` +
          `Unresolved imports:\n` +
          `  • ${details}\n\n` +
          `Hints:\n` +
          `  • Add custom path aliases in novu.config.ts under the aliases field\n` +
          `  • Or define aliases in tsconfig/jsconfig paths and run publish from the matching project root`
      );
    }

    return new Error(`Failed to bundle workflow: ${workflowId}\n${error.message}`);
  }

  if (error instanceof Error) {
    return new Error(`Failed to bundle workflow: ${workflowId}\n${error.message}`);
  }

  return new Error(`Failed to bundle workflow: ${workflowId}`);
}

function isBuildFailure(error: unknown): error is esbuild.BuildFailure {
  return typeof error === 'object' && error !== null && 'errors' in error && Array.isArray(error.errors);
}
