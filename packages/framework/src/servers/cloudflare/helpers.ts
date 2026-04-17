/**
 * Opt-in helpers for users who want automatic "last ref" tracking without
 * manually threading NovuConversationRef through schedule payloads or state.
 *
 * @example
 * ```ts
 * import { rememberLastRef, replyToLastConversation } from '@novu/framework/cloudflare/helpers';
 *
 * class Bot extends withNovuAgent(Agent)<Env> {
 *   async onNovuMessage(ctx) {
 *     rememberLastRef(this, ctx);
 *     await ctx.reply('Got it!');
 *   }
 *
 *   async scheduledFollowUp() {
 *     await replyToLastConversation(this, { markdown: 'Still there?' });
 *   }
 * }
 * ```
 */

import type { AgentContext, AgentReplyPayload, MessageContent, NovuConversationRef } from '../../resources/agent';
import { serializeContent } from '../../resources/agent';

const STATE_KEY = '__novuLastRef';

interface StatefulAgent {
  state: Record<string, unknown>;
  setState(patch: Record<string, unknown>): void;
  env: Record<string, unknown>;
}

/**
 * Stash the current conversation ref on the agent's DO state.
 * Call this inside `onNovuMessage` / `onNovuAction` / etc.
 */
export function rememberLastRef(agent: StatefulAgent, ctx: AgentContext): void {
  agent.setState({ [STATE_KEY]: ctx.serialize() });
}

/**
 * Reply to the most recently remembered conversation.
 * Requires `rememberLastRef` to have been called at least once.
 */
export async function replyToLastConversation(agent: StatefulAgent, content: MessageContent): Promise<void> {
  const ref = agent.state[STATE_KEY] as NovuConversationRef | undefined;
  if (!ref?.replyUrl) {
    throw new Error('No conversation ref stored — call rememberLastRef(agent, ctx) first');
  }

  const secretKey = agent.env.NOVU_SECRET_KEY as string | undefined;
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
    throw new Error(`replyToLastConversation failed (${response.status}): ${text}`);
  }
}
