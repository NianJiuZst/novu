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
        `import stepHandler${i}, { stepId as stepId${i}, workflowId as workflowId${i} } from ${JSON.stringify(
          getImportPath(s.filePath, rootDir)
        )};`
    )
    .join('\n');

  const stepEntries = steps
    .map(
      (s, i) =>
        `  [${JSON.stringify(s.stepId)}, {
    handler: stepHandler${i},
    stepId: stepId${i},
    workflowId: workflowId${i}
  }]`
    )
    .join(',\n');

  return `
${imports}

const stepHandlers = new Map([
${stepEntries}
]);

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export default {
  async fetch(request) {
    try {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
      }

      const url = new URL(request.url);
      const stepName = url.searchParams.get('step') || 
                       request.headers.get('X-Step-Name');
      
      if (!stepName) {
        return jsonResponse(
          {
            error: 'Missing step name',
            message: 'Provide step name via ?step=<name> query param or X-Step-Name header'
          },
          400
        );
      }

      const step = stepHandlers.get(stepName);
      if (!step) {
        return jsonResponse(
          {
            error: 'Step not found',
            stepName,
            available: Array.from(stepHandlers.keys()),
            workflowId: ${JSON.stringify(workflowId)},
            environmentId: ${JSON.stringify(environmentId)}
          },
          404
        );
      }

      let body = {};
      const rawBody = await request.text();
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          return jsonResponse(
            {
              error: 'Invalid JSON body',
              workflowId: ${JSON.stringify(workflowId)},
              environmentId: ${JSON.stringify(environmentId)}
            },
            400
          );
        }
      }

      if (!isObject(body)) {
        return jsonResponse(
          {
            error: 'Invalid request body',
            message: 'Body must be a JSON object',
            workflowId: ${JSON.stringify(workflowId)},
            environmentId: ${JSON.stringify(environmentId)}
          },
          400
        );
      }

      const payload = body.payload ?? {};
      const subscriber = body.subscriber ?? {};
      const context = body.context ?? {};
      const stepOutputs = body.steps ?? {};

      if (!isObject(payload) || !isObject(subscriber) || !isObject(context) || !isObject(stepOutputs)) {
        return jsonResponse(
          {
            error: 'Invalid request body',
            message: 'payload, subscriber, context, and steps must be JSON objects',
            workflowId: ${JSON.stringify(workflowId)},
            environmentId: ${JSON.stringify(environmentId)}
          },
          400
        );
      }

      // Call the user's step handler function
      const result = await step.handler({ payload, subscriber, context, steps: stepOutputs });

      return jsonResponse(
        {
          stepId: step.stepId,
          workflowId: step.workflowId,
          subject: result.subject,
          body: result.body,
          environmentId: ${JSON.stringify(environmentId)}
        },
        200
      );
    } catch (error) {
      console.error('Error executing step handler:', error);
      
      return jsonResponse(
        {
          error: 'Step execution failed',
          message: 'Internal server error',
          workflowId: ${JSON.stringify(workflowId)},
          environmentId: ${JSON.stringify(environmentId)}
        },
        500
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
