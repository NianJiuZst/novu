import { NovuRequestHandler, type ServeHandlerOptions } from '../../handler';
import type { Workflow } from '../../types';
import type { SupportedFrameworkName } from '../../types/server.types';
import { validateNovuSignature } from '../../utils';

export const frameworkName: SupportedFrameworkName = 'cloudflare';

interface NovuAgentClass {
  novuAgentId: string;
  new (...args: any[]): any;
}

export interface CreateNovuRouterOptions extends ServeHandlerOptions {
  agents: Record<string, NovuAgentClass>;
  workflows?: Workflow[];
  /**
   * Fallback handler for requests that don't match any Novu action.
   * Typically `routeAgentRequest` from the `agents` package so the
   * Cloudflare Agents SDK's `/agents/*` routing keeps working.
   */
  fallthrough?: (request: Request, env: any, ctx?: ExecutionContext) => Promise<Response | undefined | null>;
}

/**
 * Worker `fetch` handler that routes Novu bridge traffic to the correct
 * Durable Object and delegates everything else (workflows, health checks)
 * to the standard `NovuRequestHandler`.
 *
 * @example
 * ```ts
 * import { routeAgentRequest } from 'agents';
 * import { createNovuRouter } from '@novu/framework/cloudflare';
 *
 * export default {
 *   fetch: createNovuRouter({
 *     agents: { WineBot },
 *     workflows: [handoffWorkflow],
 *     fallthrough: routeAgentRequest,
 *   }),
 * };
 * ```
 */
export function createNovuRouter(options: CreateNovuRouterOptions) {
  const agentIdToBinding = new Map<string, string>();
  for (const [bindingName, agentClass] of Object.entries(options.agents)) {
    if (agentClass.novuAgentId) {
      agentIdToBinding.set(agentClass.novuAgentId, bindingName);
    }
  }

  const novuHandler = new NovuRequestHandler({
    frameworkName,
    ...options,
    handler: (request: Request, _env: unknown, ctx: ExecutionContext) => ({
      body: () => request.clone().json(),
      headers: (key: string) => request.headers.get(key),
      method: () => request.method,
      url: () => new URL(request.url),
      queryString: (key: string, url: URL) => url.searchParams.get(key),
      waitUntil: ctx?.waitUntil?.bind(ctx),
      transformResponse: ({ status, headers, body }) => new Response(body, { status, headers }),
    }),
  });

  const baseHandler = novuHandler.createHandler();

  // biome-ignore lint/suspicious/noExplicitAny: env shape is user-defined
  return async (request: Request, env: any, ctx: ExecutionContext): Promise<Response> => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || '';

    if (request.method === 'POST' && action === 'agent-event') {
      return handleAgentEvent(request, url, env, agentIdToBinding, novuHandler.client);
    }

    if (request.method === 'OPTIONS') {
      return baseHandler(request, env, ctx);
    }

    if (action && action !== 'agent-event') {
      return baseHandler(request, env, ctx);
    }

    if (options.fallthrough) {
      const result = await options.fallthrough(request, env, ctx);
      if (result) {
        return result;
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

async function handleAgentEvent(
  request: Request,
  url: URL,
  env: any,
  agentIdToBinding: Map<string, string>,
  client: { secretKey: string; strictAuthentication: boolean }
): Promise<Response> {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    await validateNovuSignature(
      body,
      request.headers.get('x-novu-signature'),
      client.secretKey,
      client.strictAuthentication
    );

    const agentId = url.searchParams.get('agentId') || '';
    const bindingName = agentIdToBinding.get(agentId);

    if (!bindingName) {
      return Response.json({ error: `Agent '${agentId}' not registered` }, { status: 404 });
    }

    const binding = env[bindingName];
    if (!binding) {
      return Response.json(
        { error: `Durable Object binding '${bindingName}' not found in env` },
        { status: 500 }
      );
    }

    const conversationId = body.conversationId;
    if (!conversationId) {
      return Response.json({ error: 'Missing conversationId in body' }, { status: 400 });
    }

    const doId = binding.idFromName(conversationId);
    const stub = binding.get(doId);

    const forwardedRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: bodyText,
    });

    return stub.fetch(forwardedRequest);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = (err as any)?.statusCode ?? 500;

    return Response.json({ error: message }, { status });
  }
}

export { validateNovuSignature as verifyNovuSignature } from '../../utils';
