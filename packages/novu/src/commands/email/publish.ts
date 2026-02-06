import * as fs from 'fs/promises';
import ora from 'ora';
import * as path from 'path';
import { green, red, yellow } from 'picocolors';
import { StepResolverClient } from './api';
import { bundleAllWorkflows, formatBundleSize } from './bundler';
import { loadConfig } from './config/loader';
import { discoverStepFiles } from './discovery';
import type { DeploymentResult, DiscoveredStep, EnvironmentInfo, WorkflowBundle } from './types';

interface PublishOptions {
  secretKey?: string;
  apiUrl?: string;
  config?: string;
  out?: string;
  workflow?: string;
  bundleOutDir?: string | boolean;
  dryRun?: boolean;
}

interface DeploymentError {
  workflowId: string;
  error: string;
}

interface DeploymentOutcome {
  deployments: DeploymentResult[];
  errors: DeploymentError[];
}

const DEFAULT_API_URL = 'https://api.novu.co';
const DEFAULT_STEPS_DIR = './novu';

export async function emailPublish(options: PublishOptions): Promise<void> {
  try {
    const rootDir = process.cwd();
    const config = await loadConfig(options.config);
    const apiUrl = options.apiUrl || process.env.NOVU_API_URL || config?.apiUrl || DEFAULT_API_URL;
    const secretKey = options.secretKey || process.env.NOVU_SECRET_KEY;
    assertSecretKey(secretKey);

    const stepsDirLabel = options.out || config?.outDir || DEFAULT_STEPS_DIR;
    const stepsDir = path.resolve(rootDir, stepsDirLabel);
    console.log('');
    const client = new StepResolverClient(apiUrl, secretKey);
    const envInfo = await authenticate(client, apiUrl);

    const discoveredSteps = await discoverAndValidateSteps(stepsDir, stepsDirLabel);
    const workflowSteps = groupStepsByWorkflow(discoveredSteps);
    filterWorkflows(workflowSteps, options.workflow);
    const selectedSteps = flattenWorkflowSteps(workflowSteps);
    printDiscoveredSteps(selectedSteps, discoveredSteps.length, workflowSteps.size, options.workflow);

    const shouldMinifyBundles = !options.bundleOutDir;
    if (!shouldMinifyBundles) {
      console.log(yellow('ℹ Debug bundle mode enabled: generating unminified workflow bundles.'));
      console.log('');
    }
    const bundles = await bundleWorkflows(workflowSteps, envInfo._id, rootDir, shouldMinifyBundles, config?.aliases);

    const bundleOutputDir = resolveBundleOutputDir(options.bundleOutDir, rootDir);
    if (bundleOutputDir) {
      await writeBundleArtifactsWithSpinner(bundles, bundleOutputDir, rootDir);
    }

    if (options.dryRun) {
      printDryRunSummary(bundles);
      return;
    }

    const deploymentOutcome = await deployBundles(client, bundles, envInfo._id);
    if (deploymentOutcome.errors.length > 0) {
      printDeploymentErrors(deploymentOutcome.errors, deploymentOutcome.deployments);
      process.exit(1);
    }

    printSuccessSummary(deploymentOutcome.deployments, selectedSteps);
  } catch (error) {
    console.error('');
    console.error(red('❌ Publish failed:'), error instanceof Error ? error.message : error);
    console.error('');
    process.exit(1);
  }
}

function assertSecretKey(secretKey?: string): asserts secretKey is string {
  if (secretKey) {
    return;
  }

  console.error('');
  console.error(red('❌ Authentication required'));
  console.error('');
  console.error('Provide your API key via:');
  console.error('  1. CLI flag: npx novu email publish --secret-key nv-xxx');
  console.error('  2. Environment: export NOVU_SECRET_KEY=nv-xxx');
  console.error('  3. .env file: NOVU_SECRET_KEY=nv-xxx');
  console.error('');
  console.error('Get your API key at: https://dashboard.novu.co/api-keys');
  console.error('');
  process.exit(1);
}

async function authenticate(client: StepResolverClient, apiUrl: string): Promise<EnvironmentInfo> {
  const authSpinner = ora('Authenticating with Novu...').start();

  try {
    await client.validateConnection();
    const envInfo = await client.getEnvironmentInfo();
    authSpinner.succeed('Authenticated with Novu');
    console.log(`   ${green('✓')} Environment: ${envInfo.name} (${envInfo._id})`);
    console.log('');
    return envInfo;
  } catch (error) {
    authSpinner.fail('Authentication failed');
    console.error('');
    if (error instanceof Error) {
      console.error(red(error.message));
    }
    console.error('');
    console.error(`Using API URL: ${apiUrl}`);
    console.error('(For EU region, use: --api-url https://eu.api.novu.co)');
    console.error('');
    process.exit(1);
  }
}

async function discoverAndValidateSteps(stepsDir: string, stepsDirLabel: string): Promise<DiscoveredStep[]> {
  const discoverySpinner = ora(`Discovering steps in ${stepsDirLabel}...`).start();

  try {
    const discovery = await discoverStepFiles(stepsDir);

    if (discovery.matchedFiles === 0) {
      discoverySpinner.fail('No step files found');
      console.error('');
      console.error(red(`❌ No step files found in ${stepsDir}`));
      console.error('');
      console.error('Expected *.step.tsx, *.step.ts, *.step.jsx, or *.step.js files.');
      console.error('');
      console.error("Run 'npx novu email init' first to generate step handlers.");
      console.error('');
      process.exit(1);
    }

    if (!discovery.valid) {
      discoverySpinner.fail('Step file validation failed');
      console.error('');
      console.error(red('❌ Step file validation failed'));
      console.error('');

      for (const fileError of discovery.errors) {
        console.error(red(`Errors in ${fileError.filePath}:`));
        for (const error of fileError.errors) {
          console.error(red(`  • ${error}`));
        }
        console.error('');
      }

      console.error("Fix these errors and run 'npx novu email init --force' to regenerate step files.");
      console.error('');
      process.exit(1);
    }

    discoverySpinner.succeed('Discovered step files');
    return discovery.steps;
  } catch (error) {
    discoverySpinner.fail('Discovery failed');
    console.error('');
    console.error(red('❌ Failed to discover step files'));
    if (error instanceof Error) {
      console.error(red(error.message));
    }
    console.error('');
    process.exit(1);
  }
}

function groupStepsByWorkflow(steps: DiscoveredStep[]): Map<string, DiscoveredStep[]> {
  const workflowSteps = new Map<string, DiscoveredStep[]>();

  for (const step of steps) {
    const existing = workflowSteps.get(step.workflowId) || [];
    existing.push(step);
    workflowSteps.set(step.workflowId, existing);
  }

  return workflowSteps;
}

function filterWorkflows(workflowSteps: Map<string, DiscoveredStep[]>, workflow?: string): void {
  if (!workflow) {
    return;
  }

  const selectedSteps = workflowSteps.get(workflow);
  if (!selectedSteps) {
    console.error(red(`❌ Workflow not found: ${workflow}`));
    console.error('');
    console.error('Available workflows:');
    for (const workflowId of workflowSteps.keys()) {
      console.error(`  • ${workflowId}`);
    }
    console.error('');
    process.exit(1);
  }

  workflowSteps.clear();
  workflowSteps.set(workflow, selectedSteps);
}

function flattenWorkflowSteps(workflowSteps: Map<string, DiscoveredStep[]>): DiscoveredStep[] {
  return Array.from(workflowSteps.values()).flat();
}

function printDiscoveredSteps(
  steps: DiscoveredStep[],
  totalDiscoveredSteps: number,
  workflowCount: number,
  selectedWorkflow?: string
): void {
  for (const step of steps) {
    console.log(`   ${green('✓')} ${step.stepId} (workflow: ${step.workflowId})`);
  }

  console.log('');
  if (selectedWorkflow) {
    console.log(
      `   Found ${steps.length} step(s) across ${workflowCount} workflow(s) (filtered from ${totalDiscoveredSteps} total step(s))`
    );
  } else {
    console.log(`   Found ${steps.length} step(s) across ${workflowCount} workflow(s)`);
  }
  console.log('');
}

async function bundleWorkflows(
  workflowSteps: Map<string, DiscoveredStep[]>,
  environmentId: string,
  rootDir: string,
  minify: boolean,
  aliases?: Record<string, string>
): Promise<WorkflowBundle[]> {
  const bundleSpinner = ora('Bundling workflows...').start();

  try {
    const bundles = await bundleAllWorkflows(workflowSteps, environmentId, rootDir, { minify, aliases });
    bundleSpinner.succeed('Bundled workflows');

    for (const bundle of bundles) {
      console.log(
        `   ${green('✓')} ${bundle.workflowId}: ${bundle.stepIds.length} steps, ${formatBundleSize(bundle.size)}`
      );
    }
    console.log('');

    return bundles;
  } catch (error) {
    bundleSpinner.fail('Bundling failed');
    console.error('');
    if (error instanceof Error) {
      console.error(red(error.message));
    }
    console.error('');
    process.exit(1);
  }
}

async function writeBundleArtifactsWithSpinner(
  bundles: WorkflowBundle[],
  outputDir: string,
  rootDir: string
): Promise<void> {
  const outputDirLabel = path.relative(rootDir, outputDir) || '.';
  const writeSpinner = ora(`Writing bundle artifacts to ${outputDirLabel}...`).start();

  try {
    const artifacts = await writeBundleArtifacts(bundles, outputDir);
    writeSpinner.succeed(`Saved bundle artifacts to ${outputDirLabel}`);

    for (const artifact of artifacts) {
      console.log(
        `   ${green('✓')} ${artifact.workflowId}: ${path.relative(rootDir, artifact.bundlePath)} ` +
          `(${path.relative(rootDir, artifact.metadataPath)})`
      );
    }
    console.log('');
  } catch (error) {
    writeSpinner.fail('Failed to write bundle artifacts');
    console.error('');
    if (error instanceof Error) {
      console.error(red(error.message));
    }
    console.error('');
    process.exit(1);
  }
}

function printDryRunSummary(bundles: WorkflowBundle[]): void {
  console.log(yellow('🔍 Dry run mode - skipping deployment'));
  console.log('');
  console.log('Bundle information:');
  for (const bundle of bundles) {
    console.log(`  • ${bundle.workflowId}: ${formatBundleSize(bundle.size)}, ${bundle.stepIds.length} step(s)`);
    console.log(`    Steps: ${bundle.stepIds.join(', ')}`);
  }
  console.log('');
  console.log(green('✅ Bundle successful!'));
  console.log('');
}

async function deployBundles(
  client: StepResolverClient,
  bundles: WorkflowBundle[],
  environmentId: string
): Promise<DeploymentOutcome> {
  const deploySpinner = ora('Deploying to Novu worker...').start();
  const deployments: DeploymentResult[] = [];
  const errors: DeploymentError[] = [];

  let processed = 0;
  for (const bundle of bundles) {
    try {
      const result = await client.deployWorkflow(bundle);
      deployments.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ workflowId: bundle.workflowId, error: errorMessage });
    }

    processed += 1;
    deploySpinner.text = `Deploying to Novu worker... (${processed}/${bundles.length})`;
  }

  if (errors.length === 0) {
    deploySpinner.succeed('Deployed to Novu worker');
  } else if (deployments.length > 0) {
    deploySpinner.fail('Deployment completed with errors');
  } else {
    deploySpinner.fail('All deployments failed');
  }

  if (deployments.length > 0) {
    for (const deployment of deployments) {
      console.log(`   ${green('✓')} ${environmentId}-${deployment.workflowId}-${deployment.version}`);
    }
    console.log('');
  }

  return {
    deployments,
    errors,
  };
}

function printDeploymentErrors(errors: DeploymentError[], deployments: DeploymentResult[]): void {
  console.error('');
  console.error(red('❌ Some deployments failed:'));
  console.error('');
  for (const { workflowId, error } of errors) {
    console.error(red(`  ${workflowId}: ${error}`));
  }
  console.error('');

  if (deployments.length > 0) {
    console.log(yellow('Other workflows deployed successfully:'));
    for (const deployment of deployments) {
      console.log(`  ${green('✓')} ${deployment.workflowId}`);
    }
    console.log('');
  }
}

function printSuccessSummary(deployments: DeploymentResult[], steps: DiscoveredStep[]): void {
  console.log(green('✅ Deployment successful!'));
  console.log(`   Version: ${deployments[0]?.version || 'Unknown'}`);
  console.log(`   Deployed: ${deployments.length} workflow(s), ${steps.length} step(s)`);
  console.log('');

  console.log('   Steps deployed:');
  const stepIdWidth = Math.max('Step'.length, ...steps.map((s) => s.stepId.length)) + 2;
  const workflowIdWidth = Math.max('Workflow'.length, ...steps.map((s) => s.workflowId.length)) + 2;

  console.log('   ┌' + '─'.repeat(stepIdWidth) + '┬' + '─'.repeat(workflowIdWidth) + '┬─────────┐');
  console.log('   │ ' + 'Step'.padEnd(stepIdWidth - 1) + '│ ' + 'Workflow'.padEnd(workflowIdWidth - 1) + '│ Status  │');
  console.log('   ├' + '─'.repeat(stepIdWidth) + '┼' + '─'.repeat(workflowIdWidth) + '┼─────────┤');

  for (const step of steps) {
    console.log(
      '   │ ' +
        step.stepId.padEnd(stepIdWidth - 1) +
        '│ ' +
        step.workflowId.padEnd(workflowIdWidth - 1) +
        '│ ' +
        green('✅ Live') +
        ' │'
    );
  }

  console.log('   └' + '─'.repeat(stepIdWidth) + '┴' + '─'.repeat(workflowIdWidth) + '┴─────────┘');
  console.log('');
}

interface BundleArtifactFiles {
  workflowId: string;
  bundlePath: string;
  metadataPath: string;
}

async function writeBundleArtifacts(bundles: WorkflowBundle[], outputDir: string): Promise<BundleArtifactFiles[]> {
  await fs.mkdir(outputDir, { recursive: true });

  const usedNames = new Map<string, number>();
  const artifacts: BundleArtifactFiles[] = [];

  for (const bundle of bundles) {
    const fileBaseName = getUniqueFileBaseName(bundle.workflowId, usedNames);
    const bundlePath = path.join(outputDir, `${fileBaseName}.worker.mjs`);
    const metadataPath = path.join(outputDir, `${fileBaseName}.meta.json`);

    await fs.writeFile(bundlePath, bundle.code, 'utf8');
    await fs.writeFile(
      metadataPath,
      `${JSON.stringify(
        {
          workflowId: bundle.workflowId,
          size: bundle.size,
          stepIds: bundle.stepIds,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      )}\n`,
      'utf8'
    );

    artifacts.push({
      workflowId: bundle.workflowId,
      bundlePath,
      metadataPath,
    });
  }

  return artifacts;
}

function getUniqueFileBaseName(workflowId: string, usedNames: Map<string, number>): string {
  const baseName = toSafeFileName(workflowId);
  const currentCount = usedNames.get(baseName) ?? 0;
  usedNames.set(baseName, currentCount + 1);

  if (currentCount === 0) {
    return baseName;
  }

  return `${baseName}-${currentCount + 1}`;
}

function toSafeFileName(value: string): string {
  const sanitized = value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-');
  const collapsed = sanitized.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return collapsed || 'workflow';
}

function resolveBundleOutputDir(bundleOutDir: PublishOptions['bundleOutDir'], rootDir: string): string | undefined {
  if (!bundleOutDir) {
    return undefined;
  }

  if (bundleOutDir === true) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.resolve(rootDir, '.novu', 'bundles', timestamp);
  }

  return path.resolve(rootDir, bundleOutDir);
}
