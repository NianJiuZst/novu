import { AIChatAgent } from '@cloudflare/ai-chat';
import { routeAgentRequest } from 'agents';
import { createWorkersAI } from 'workers-ai-provider';
import { generateText } from 'ai';
import { withNovuAgent, createNovuRouter, toMessageList, type NovuConversationRef } from '@novu/framework/cloudflare';

interface Env {
  AI: Ai;
  WineBot: DurableObjectNamespace;
  NOVU_SECRET_KEY: string;
}

export class WineBot extends withNovuAgent(AIChatAgent)<Env> {
  static novuAgentId = 'wine-bot';

  async onNovuMessage(ctx: import('@novu/framework').AgentContext) {
    const workersai = createWorkersAI({ binding: this.env.AI });
    const result = await generateText({
      model: workersai('@cf/meta/llama-3.3-70b-instruct-fp8-fast'),
      system: 'You are a helpful wine sommelier. Keep answers concise.',
      messages: toMessageList(ctx),
    });

    await ctx.reply({ markdown: result.text });

    this.schedule('2h', 'followUp', ctx.serialize());
  }

  async onNovuAction(ctx: import('@novu/framework').AgentContext) {
    if (ctx.action?.actionId === 'escalate') {
      ctx.trigger('human-handoff', { to: ctx.subscriber?.email });
      ctx.resolve('Escalated to human');
    }
  }

  async followUp(ref: NovuConversationRef) {
    await this.replyFromRef(ref, { markdown: 'Still thinking about that pairing? Let me know!' });
  }
}

export default {
  fetch: createNovuRouter({
    agents: { WineBot },
    fallthrough: routeAgentRequest,
  }),
};
