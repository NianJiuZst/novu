import * as path from 'path';
import type { DiscoveredStep } from '../types';

export function generateWorkerWrapper(
  steps: DiscoveredStep[],
  workflowId: string,
  environmentId: string,
  rootDir: string
): string {
  const imports = steps
    .map(
      (s, i) =>
        `import stepHandler${i}, { stepId as stepId${i}, workflowId as workflowId${i} } from '${getImportPath(
          s.filePath,
          rootDir
        )}';`
    )
    .join('\n');

  const stepMap = steps
    .map(
      (s, i) =>
        `  '${s.stepId}': {
    handler: stepHandler${i},
    stepId: stepId${i},
    workflowId: workflowId${i}
  }`
    )
    .join(',\n');

  return `
import React from 'react';
${imports}

const stepHandlers = {
${stepMap}
};

export default {
  async fetch(request) {
    try {
      if (request.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const url = new URL(request.url);
      const stepName = url.searchParams.get('step') || 
                       request.headers.get('X-Step-Name');
      
      if (!stepName) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing step name',
            message: 'Provide step name via ?step=<name> query param or X-Step-Name header'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const step = stepHandlers[stepName];
      if (!step) {
        return new Response(
          JSON.stringify({ 
            error: 'Step not found',
            stepName,
            available: Object.keys(stepHandlers),
            workflowId: '${workflowId}',
            environmentId: '${environmentId}'
          }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const body = await request.json();
      const { payload = {}, subscriber = {}, context = {}, steps = {} } = body;

      // Call the user's step handler function
      const result = await step.handler({ payload, subscriber, context, steps });

      return new Response(
        JSON.stringify({
          stepId: step.stepId,
          workflowId: step.workflowId,
          subject: result.subject,
          body: result.body,
          environmentId: '${environmentId}'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error executing step handler:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Step execution failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          workflowId: '${workflowId}',
          environmentId: '${environmentId}'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};
`.trim();
}

function getImportPath(filePath: string, rootDir: string): string {
  // Use rootDir-relative imports so esbuild can resolve local step handlers.
  const withoutExt = filePath.replace(/\.(ts|tsx|js|jsx)$/, '');
  const normalizedRootDir = path.resolve(rootDir);
  const relativeImportPath = path.relative(normalizedRootDir, withoutExt).split(path.sep).join('/');

  if (relativeImportPath.startsWith('.') || relativeImportPath.startsWith('/')) {
    return relativeImportPath;
  }

  return `./${relativeImportPath}`;
}
