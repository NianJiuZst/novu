import { Agent, routeAgentRequest } from 'agents';
import {
  withNovuAgent,
  createNovuRouter,
  toMessageList,
  Card,
  CardText,
  Actions,
  Button,
  type NovuConversationRef,
  type AgentContext,
} from '@novu/framework/cloudflare';

interface Env {
  AI: Ai;
  CleaningBot: DurableObjectNamespace;
  NOVU_SECRET_KEY: string;
}

export class CleaningBot extends withNovuAgent(Agent)<Env> {
  static novuAgentId = 'cleaning-bot';

  async onNovuMessage(ctx: AgentContext) {
    const messages = toMessageList(ctx);

    const result = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful cleaning assistant. Keep answers concise (2-3 sentences max). Give practical cleaning tips.',
        },
        ...messages,
      ],
    });

    const text = (result as { response?: string }).response ?? 'Sorry, I could not generate a response.';

    await ctx.reply(
      Card({
        title: 'Cleaning Assistant',
        children: [
          CardText(text),
          Actions([
            Button({ id: 'follow-up', label: 'Remind me in 30s', style: 'primary' }),
            Button({ id: 'done', label: 'Thanks, all clean!', style: 'secondary' }),
          ]),
        ],
      })
    );
  }

  async onNovuAction(ctx: AgentContext) {
    if (ctx.action?.actionId === 'follow-up') {
      await ctx.reply('Got it! I\'ll send you a reminder in 30 seconds.');
      this.schedule(30, 'sendReminder', ctx.serialize());

      return;
    }

    if (ctx.action?.actionId === 'done') {
      ctx.metadata.set('resolved', true);
      ctx.metadata.set('resolvedAt', new Date().toISOString());
      await ctx.reply(
        Card({
          title: 'Session complete',
          children: [
            CardText('Great job! Your space is sparkling clean. Message me anytime you need more tips.'),
          ],
        })
      );
      ctx.resolve('User marked as done');
    }
  }

  async sendReminder(ref: NovuConversationRef) {
    await this.replyFromRef(ref, {
      markdown: 'Hey! Just checking in — did you finish that cleaning task? Let me know if you need more tips!',
    });
  }
}

export default {
  fetch: createNovuRouter({
    agents: { CleaningBot },
    fallthrough: routeAgentRequest,
  }),
};
