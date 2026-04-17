import type { AgentContext, AgentHistoryEntry } from '../../resources/agent';

type LLMMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Convert a Novu agent context into a message list ready for any LLM client
 * (Vercel AI SDK, OpenAI, Anthropic, Workers AI, etc.).
 *
 * Includes the full conversation history plus the current inbound message
 * (if present) as the final user turn.
 *
 * @example
 * ```ts
 * import { toMessageList } from '@novu/framework/cloudflare';
 *
 * async onNovuMessage(ctx) {
 *   const result = await generateText({
 *     model: workersai('@cf/meta/llama-3.3-70b-instruct'),
 *     messages: toMessageList(ctx),
 *   });
 *   await ctx.reply({ markdown: result.text });
 * }
 * ```
 */
export function toMessageList(ctx: AgentContext): LLMMessage[] {
  const messages: LLMMessage[] = ctx.history.map(mapHistoryEntry);

  if (ctx.message?.text) {
    messages.push({ role: 'user', content: ctx.message.text });
  }

  return messages;
}

function mapHistoryEntry(entry: AgentHistoryEntry): LLMMessage {
  if (entry.role === 'agent' || entry.role === 'assistant') {
    return { role: 'assistant', content: entry.content };
  }

  if (entry.role === 'system') {
    return { role: 'system', content: entry.content };
  }

  return { role: 'user', content: entry.content };
}
