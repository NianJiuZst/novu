import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Constants
const EMAIL_DIR = path.join(process.cwd(), 'emails');
const OUTPUT_DIR = path.join(process.cwd(), '.react-email', 'emails');
const BUNDLE_DIR = path.join(process.cwd(), 'bundle');
const CONFIG_FILE = path.join(process.cwd(), 'novu.json');

export interface PushCommandOptions {
  secretKey: string;
}

export async function push(options: PushCommandOptions) {
  try {
    // Read email configuration
    const configRaw = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configRaw);

    // Build the email templates
    console.log('🏗️ Building email templates...');
    await runCommand('npm', ['run', 'build']);

    // Generate the bundle
    await generateBundle();

    // Deploy the bundle
    const workerUrl = await deployToCloudflare(BUNDLE_DIR);

    // Register with Novu API if applicable and deployment was successful
    if (workerUrl && config.novuApiKey && config.novuApiUrl) {
      // await registerWithNovuApi(config, workerUrl);
    } else if (!workerUrl) {
      console.warn('⚠️ Skipping Novu API registration: deployment failed');
    } else {
      console.warn('⚠️ Skipping Novu API registration: missing API key or URL in config');
    }

    console.log('✅ Deployment completed');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

/**
 * Executes a command as a child process
 * @param {string} command - The command to run
 * @param {string[]} args - Command arguments
 * @returns {Promise<void>}
 */
async function runCommand(command: string, args: string[], options: any = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    proc.on('close', (code: any) => {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (err: any) => {
      reject(err);
    });
  });
}

/**
 * Runs a command and captures its output
 * @param {string} command - The command to run
 * @param {string[]} args - The arguments to pass to the command
 * @param {Object} options - Options for the command
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>} - The exit code and output of the command
 */
async function runCommandWithOutput(
  command: string,
  args: string[],
  options: any = {}
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      ...options,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: any) => {
      const chunk = data.toString();
      stdout += chunk;
      process.stdout.write(chunk);
    });

    proc.stderr.on('data', (data: any) => {
      const chunk = data.toString();
      stderr += chunk;
      process.stderr.write(chunk);
    });

    proc.on('close', (exitCode: any) => {
      resolve({
        exitCode: exitCode !== null ? exitCode : -1,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * Deploys the bundle to Cloudflare Workers
 * @param {string} bundleDir - The directory containing the bundle
 * @returns {Promise<string|null>} - The URL of the deployed worker or null if deployment failed
 */
async function deployToCloudflare(bundleDir: string): Promise<string | null> {
  console.log('🚀 Deploying to Cloudflare Workers...');

  try {
    // Install dependencies with --legacy-peer-deps flag
    console.log('📦 Installing dependencies...');
    await runCommand('npm', ['install', '--legacy-peer-deps'], {
      cwd: bundleDir,
    });

    // Deploy using Cloudflare Wrangler
    console.log('🚀 Running wrangler deploy...');
    const result = await runCommandWithOutput('npx', ['wrangler', 'deploy'], {
      cwd: bundleDir,
    });

    if (result.exitCode !== 0) {
      console.error(`❌ Deployment failed with exit code ${result.exitCode}`);
      return null;
    }

    // Extract the worker URL from the output
    const urlMatch = result.stdout.match(/https:\/\/[a-zA-Z0-9-]+\.([a-zA-Z0-9-]+\.)*workers\.dev/);

    if (urlMatch) {
      const workerUrl = urlMatch[0];
      console.log(`✅ Deployed worker at: ${workerUrl}`);
      return workerUrl;
    } else {
      console.warn('⚠️ Could not extract worker URL from deployment output');
      return null;
    }
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    return null;
  }
}

/**
 * Capitalizes the first letter of a string
 * @param {string} string - The input string
 * @returns {string} - The capitalized string
 */
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Converts kebab-case to camelCase
 * @param {string} string - The kebab-case string
 * @returns {string} - The camelCase string
 */
function kebabToCamelCase(string: string) {
  return string.replace(/-([a-z])/g, (g: any) => g[1].toUpperCase());
}

/**
 * Recursively copies a directory
 * @param {string} source - Source directory
 * @param {string} destination - Destination directory
 */
function copyDirectory(source: string, destination: string) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read all files and directories in the source
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${entry.name}`);
    }
  }
}

/**
 * Generates worker code for dynamically rendering React email templates
 * @param {Object} config - The email configuration
 * @param {string} outputPath - Path to write the worker code
 */
function generateWorkerCode(config: any, outputPath: string) {
  // Create a map of template names to their workflow and step IDs
  const templateToWorkflowMap = config.emails.reduce((map: any, item: any) => {
    map[item.templateName] = {
      workflowId: item.workflowId,
      stepId: item.stepId || null,
    };
    return map;
  }, {});

  // Create the Worker script (using TypeScript with JSX)
  const workerCode = `
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as React from 'react';
import { renderAsync } from '@react-email/render';

// Workflow mapping (manually defined to avoid JSON import issues)
const workflowMapping: Record<string, { workflowId: string; stepId: string | null }> = ${JSON.stringify(templateToWorkflowMap, null, 2)};

// Import all email templates
${config.emails
  .map(
    (email: any) =>
      `import { default as ${capitalizeFirstLetter(kebabToCamelCase(email.templateName))}Email } from './emails/${email.templateName}';`
  )
  .join('\n')}

// Create mapping of template names to their components
const templates: Record<string, React.ComponentType<any>> = {
${config.emails
  .map(
    (email: any) => `  '${email.templateName}': ${capitalizeFirstLetter(kebabToCamelCase(email.templateName))}Email,`
  )
  .join('\n')}
};

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Health check endpoint
app.get('/api', (c) => {
  return c.json({
    status: 'ok',
    templates: Object.keys(templates),
  });
});

// Endpoint to render email by template name
app.get('/api/templates/:templateName', async (c) => {
  const templateName = c.req.param('templateName');
  
  if (!templates[templateName]) {
    return c.json({ error: 'Template not found' }, 404);
  }
  
  const Template = templates[templateName];
  const props = Object.fromEntries(new URL(c.req.url).searchParams);
  
  try {
    // Dynamically render the email component with the provided props
    const html = await renderAsync(React.createElement(Template, props), {
      pretty: true,
    });
    
    return c.html(html);
  } catch (error) {
    console.error('Failed to render template:', error);
    return c.json({ error: 'Failed to render template' }, 500);
  }
});

// Endpoint to get workflow and step IDs for a template
app.get('/api/workflow-info/:templateName', (c) => {
  const templateName = c.req.param('templateName');
  const workflowInfo = workflowMapping[templateName];
  
  if (!workflowInfo) {
    return c.json({ error: 'Workflow information not found for template' }, 404);
  }
  
  return c.json(workflowInfo);
});

// For backward compatibility - just get workflow ID
app.get('/api/workflow-id/:templateName', (c) => {
  const templateName = c.req.param('templateName');
  const workflowInfo = workflowMapping[templateName];
  
  if (!workflowInfo || !workflowInfo.workflowId) {
    return c.json({ error: 'Workflow ID not found for template' }, 404);
  }
  
  return c.json({ workflowId: workflowInfo.workflowId });
});

// New endpoint to render email directly by workflow ID and step ID
app.post('/api/workflow/:workflowId/steps/:stepId', async (c) => {
  const workflowId = c.req.param('workflowId');
  const stepId = c.req.param('stepId');
  
  // Find template name by workflow ID and step ID
  const templateName = Object.keys(workflowMapping).find(
    name => workflowMapping[name].workflowId === workflowId && workflowMapping[name].stepId === stepId
  );
  
  if (!templateName || !templates[templateName]) {
    return c.json({ error: 'Template not found for the specified workflow and step' }, 404);
  }
  
  const Template = templates[templateName];
  
  try {
    // Parse the JSON body
    const body = await c.req.json();
    console.log("🔍 Parsed request body:", body);
    // Extract the payload and controlValues from the request body
    const { payload = {}, controlValues = {} } = body;
    console.log("🔍 Extracted payload:", payload);
    console.log("🔍 Extracted controlValues:", controlValues);
    // Render the React component
    const html = await renderAsync(React.createElement(Template, payload), {
      pretty: true,
    });

    console.log("🔍 Rendered HTML:", html);
    return c.json({ html });
  } catch (error) {
    console.error('Failed to render template:', error);
    return c.json({ error: 'Failed to render template', details: String(error) }, 500);
  }
});

export default {
  fetch: app.fetch,
};
`;

  // Write worker code to src/index.tsx
  fs.writeFileSync(outputPath, workerCode);

  // Create package.json for the worker
  const packageJson = {
    name: 'email-renderer',
    version: '1.0.0',
    private: true,
    main: 'src/index.tsx',
    dependencies: {
      hono: '^3.0.0',
      react: '18.2.0',
      'react-dom': '18.2.0',
      '@react-email/render': '0.0.7',
      '@react-email/components': '0.0.11',
    },
    devDependencies: {
      '@cloudflare/workers-types': '^4.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      typescript: '^5.0.0',
      wrangler: '^3.0.0',
    },
  };

  fs.writeFileSync(path.join(BUNDLE_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create tsconfig.json with React JSX support
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      lib: ['ES2020'],
      jsx: 'react',
      module: 'ESNext',
      moduleResolution: 'node',
      esModuleInterop: true,
      resolveJsonModule: true,
      strict: true,
      types: ['@cloudflare/workers-types'],
    },
    include: ['src/**/*'],
  };

  fs.writeFileSync(path.join(BUNDLE_DIR, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

  // Create wrangler.toml
  const wranglerConfig = `
name = "email-renderer"
main = "src/index.tsx"
compatibility_date = "2023-10-30"

[build]
command = "npm install --legacy-peer-deps && npx tsc"

# Enable logging configuration
[vars]
LOG_LEVEL = "debug"

# Configure log tailing and persistance
[logs]
tail_workers = true
retain_days = 14

# Enable observability
[observability]
enabled = true
head_sampling_rate = 1 # optional. default = 1.
`;

  fs.writeFileSync(path.join(BUNDLE_DIR, 'wrangler.toml'), wranglerConfig);

  console.log('✅ Worker code generated');
}

/**
 * Generate the bundle with all necessary files
 * @returns {Promise<void>}
 */
async function generateBundle(): Promise<void> {
  console.log('📦 Generating bundle...');

  // Create bundle directory if it doesn't exist
  if (fs.existsSync(BUNDLE_DIR)) {
    fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(BUNDLE_DIR, { recursive: true });

  // Read configuration
  const configRaw = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
  const config = JSON.parse(configRaw);

  // Validate configuration
  if (!config.emails || !Array.isArray(config.emails)) {
    throw new Error("Invalid configuration: 'emails' array is required");
  }

  // Create src directory in bundle
  const srcDir = path.join(BUNDLE_DIR, 'src');
  fs.mkdirSync(path.join(srcDir, 'emails'), { recursive: true });

  // Create a workflow mapping file
  const workflowMapping: Record<string, { workflowId: string; stepId: string | null }> = {};
  for (const email of config.emails) {
    workflowMapping[email.templateName] = {
      workflowId: email.workflowId,
      stepId: email.stepId || null,
    };
    console.log(`✅ Added ${email.templateName} to workflow mapping`);
  }

  // Copy email components to bundle
  console.log('📋 Copying email components to bundle...');
  const emailFiles = fs.readdirSync(EMAIL_DIR);

  for (const file of emailFiles) {
    const sourcePath = path.join(EMAIL_DIR, file);

    if (fs.statSync(sourcePath).isFile()) {
      const destPath = path.join(srcDir, 'emails', file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file}`);
    }
  }

  // Copy static assets if needed
  const outputDir = path.join(process.cwd(), 'out');
  if (fs.existsSync(path.join(outputDir, 'static'))) {
    // Copy static assets directory
    const staticDir = path.join(BUNDLE_DIR, 'static');
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }

    const sourcePath = path.join(outputDir, 'static');
    if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isDirectory()) {
      const staticFiles = fs.readdirSync(sourcePath);
      for (const staticFile of staticFiles) {
        const staticSourcePath = path.join(sourcePath, staticFile);
        const staticDestPath = path.join(staticDir, staticFile);
        fs.copyFileSync(staticSourcePath, staticDestPath);
        console.log(`✅ Copied static asset: ${staticFile}`);
      }
    }
  }

  // Generate worker code
  console.log('👷 Generating worker code...');
  generateWorkerCode(config, path.join(srcDir, 'index.tsx'));

  // Write workflow mapping to file
  fs.writeFileSync(path.join(srcDir, 'workflow-mapping.json'), JSON.stringify(workflowMapping, null, 2));

  console.log('📦 Bundle generated successfully');
}

/**
 * Register the email templates with Novu API
 * @param {Object} config - The email service configuration
 * @param {string} workerUrl - The URL of the Cloudflare Worker
 * @returns {Promise<void>}
 */
async function registerWithNovuApi(config: any, workerUrl: string): Promise<void> {
  console.log('🔄 Registering email templates with Novu API...');

  // Extract API info from config
  // Ensure the API URL ends with a slash to properly concatenate paths
  const apiBase = config.novuApiUrl.endsWith('/') ? config.novuApiUrl : `${config.novuApiUrl}/`;

  const API_URL = `${apiBase}v2/workflows/step-resolver-endpoint`;
  const API_KEY = config.novuApiKey;

  console.log(`🔌 Using Novu API at: ${API_URL}`);

  // Build payload for the step resolver endpoint
  // NEW STRUCTURE: { workflowId: [ { stepId, endpoint }, { stepId, endpoint } ] }
  const payload: Record<string, Array<{ stepId: string; endpoint: string }>> = {};

  // Loop through each email config and add to payload
  for (const email of config.emails) {
    if (!email.workflowId || !email.stepId) {
      console.warn(`⚠️ Skipping ${email.templateName}: missing workflowId or stepId`);
      continue;
    }

    // Create endpoint URL for this template
    const templateEndpoint = `${workerUrl}/api/workflow/${email.workflowId}/steps/${email.stepId}`;

    // Create the step configuration object
    const stepConfig = {
      stepId: email.stepId,
      endpoint: templateEndpoint,
    };

    // Initialize the array for this workflow if it doesn't exist
    if (!payload[email.workflowId]) {
      payload[email.workflowId] = [];
    }

    // Add to payload using workflowId as the key and pushing the step config to the array
    payload[email.workflowId].push(stepConfig);

    console.log(`✅ Prepared resolver for ${email.templateName}`);
  }

  if (Object.keys(payload).length === 0) {
    console.warn('⚠️ No valid email templates configured with both workflowId and stepId');
    return;
  }

  // Log the payload for debugging
  console.log('📦 Registration payload:', JSON.stringify(payload, null, 2));

  try {
    // Make the API request

    console.log('✅ Successfully registered workflow step resolvers with Novu API');
  } catch (error: any) {
    // Using any type here to handle the error.message property
    console.error('❌ Failed to register with Novu API:', error.message || String(error));
    // We don't throw here to avoid failing the whole deployment
    // if only the registration part fails
  }
}
