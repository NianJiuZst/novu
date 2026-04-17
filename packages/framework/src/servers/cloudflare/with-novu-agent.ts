import { AgentContextImpl, AgentEventEnum, serializeContent } from '../../resources/agent';
import type {
  AgentBridgeRequest,
  AgentContext,
  AgentReplyPayload,
  MessageContent,
  NovuConversationRef,
} from '../../resources/agent';

type Constructor<T = object> = abstract new (...args: any[]) => T;

interface NovuAgentStatics {
  novuAgentId: string;
}

interface NovuAgentInstance {
  onNovuMessage?(ctx: AgentContext): Promise<void>;
  onNovuAction?(ctx: AgentContext): Promise<void>;
  onNovuReaction?(ctx: AgentContext): Promise<void>;
  onNovuResolve?(ctx: AgentContext): Promise<void>;

  replyFromRef(ref: NovuConversationRef, content: MessageContent): Promise<void>;
  triggerWorkflow(workflowId: string, opts?: { to?: string; payload?: Record<string, unknown> }): Promise<void>;
}

/**
 * Mixin that adds Novu multi-channel agent capabilities to a Cloudflare
 * `Agent` or `AIChatAgent` Durable Object.
 *
 * @example
 * ```ts
 * import { AIChatAgent } from '@cloudflare/ai-chat';
 * import { withNovuAgent } from '@novu/framework/cloudflare';
 *
 * export class WineBot extends withNovuAgent(AIChatAgent)<Env> {
 *   static novuAgentId = 'wine-bot';
 *
 *   async onNovuMessage(ctx) {
 *     await ctx.reply('Hello from Cloudflare!');
 *   }
 * }
 * ```
 */
export function withNovuAgent<TBase extends Constructor>(Base: TBase) {
  abstract class NovuAgentMixin extends Base implements NovuAgentInstance {
    static novuAgentId: string;

    declare env: Record<string, unknown>;

    async onNovuMessage(_ctx: AgentContext): Promise<void> {
      /* override in subclass */
    }

    async onNovuAction(_ctx: AgentContext): Promise<void> {
      /* override in subclass */
    }

    async onNovuReaction(_ctx: AgentContext): Promise<void> {
      /* override in subclass */
    }

    async onNovuResolve(_ctx: AgentContext): Promise<void> {
      /* override in subclass */
    }

    /**
     * Handle an inbound HTTP request. Novu bridge calls (with `?action=agent-event`)
     * are intercepted; everything else passes through to the base class.
     */
    async onRequest(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const action = url.searchParams.get('action');

      if (request.method === 'POST' && action === 'agent-event') {
        return this._handleNovuBridgeRequest(request, url);
      }

      if (typeof (Base.prototype as any).onRequest === 'function') {
        return (Base.prototype as any).onRequest.call(this, request);
      }

      return new Response('Not found', { status: 404 });
    }

    /**
     * Post a reply to a Novu conversation using a previously serialized ref.
     * Works from any context: scheduled tasks, @callable methods, onEmail, etc.
     */
    async replyFromRef(ref: NovuConversationRef, content: MessageContent): Promise<void> {
      const secretKey = this.env.NOVU_SECRET_KEY as string | undefined;
      if (!secretKey) {
        throw new Error('NOVU_SECRET_KEY is not set in the Worker environment');
      }

      const body: AgentReplyPayload = {
        conversationId: ref.conversationId,
        integrationIdentifier: ref.integrationIdentifier,
        reply: serializeContent(content),
      };

      const response = await fetch(ref.replyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `ApiKey ${secretKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`replyFromRef failed (${response.status}): ${text}`);
      }
    }

    /**
     * Trigger a Novu workflow from anywhere in the DO.
     */
    async triggerWorkflow(
      workflowId: string,
      opts?: { to?: string; payload?: Record<string, unknown> }
    ): Promise<void> {
      const secretKey = this.env.NOVU_SECRET_KEY as string | undefined;
      const apiUrl = (this.env.NOVU_API_URL as string) || 'https://api.novu.co';
      if (!secretKey) {
        throw new Error('NOVU_SECRET_KEY is not set in the Worker environment');
      }

      const response = await fetch(`${apiUrl}/v1/events/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `ApiKey ${secretKey}`,
        },
        body: JSON.stringify({
          name: workflowId,
          to: opts?.to,
          payload: opts?.payload ?? {},
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`triggerWorkflow failed (${response.status}): ${text}`);
      }
    }

    private async _handleNovuBridgeRequest(request: Request, url: URL): Promise<Response> {
      try {
        const body = (await request.json()) as AgentBridgeRequest;
        const event = url.searchParams.get('event') || '';
        const secretKey = this.env.NOVU_SECRET_KEY as string | undefined;

        if (!secretKey) {
          return Response.json({ error: 'NOVU_SECRET_KEY not configured' }, { status: 500 });
        }

        const ctx = new AgentContextImpl(body, secretKey);

        const handlerMap: Partial<Record<AgentEventEnum, (c: AgentContext) => Promise<void>>> = {
          [AgentEventEnum.ON_MESSAGE]: this.onNovuMessage.bind(this),
          [AgentEventEnum.ON_ACTION]: this.onNovuAction.bind(this),
          [AgentEventEnum.ON_REACTION]: this.onNovuReaction.bind(this),
          [AgentEventEnum.ON_RESOLVE]: this.onNovuResolve.bind(this),
        };

        const handler = handlerMap[event as AgentEventEnum];
        if (handler) {
          await handler(ctx);
        }

        await ctx.flush();

        return Response.json({ status: 'ok' });
      } catch (err) {
        console.error('[novu-agent] Bridge handler error:', err);

        return Response.json(
          { error: err instanceof Error ? err.message : 'Internal error' },
          { status: 500 }
        );
      }
    }
  }

  return NovuAgentMixin as unknown as TBase & NovuAgentStatics;
}
