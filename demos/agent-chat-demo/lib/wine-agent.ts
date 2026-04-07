import OpenAI from 'openai';
import { agent } from './agent';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI();
  }

  return _openai;
}

const SYSTEM_PROMPT = `You are a friendly and knowledgeable wine sommelier bot.
You help users discover wines, offer food pairing suggestions, explain tasting notes,
and recommend bottles for any occasion or budget. Keep responses concise for chat (2-4 short paragraphs max).
When you make a specific wine recommendation, always mention the grape variety, region, and a price range.
If the user's request is vague (e.g. "recommend a wine"), ask a short clarifying question about their preferences — occasion, food pairing, budget, or flavor profile — before making a recommendation.
Use a warm, approachable tone — not pretentious.`;

const FALLBACK_REPLY = 'Hmm, I seem to have lost my train of thought. Could you ask again?';

async function generateReply(
  history: Array<{ text: string; isBot: boolean }>,
  userMessage: string,
  systemPrefix?: string
): Promise<string> {
  const systemContent = systemPrefix ? `${systemPrefix}\n\n${SYSTEM_PROMPT}` : SYSTEM_PROMPT;

  const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...history.map(
      (m): OpenAI.ChatCompletionMessageParam => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text,
      })
    ),
    { role: 'user', content: userMessage },
  ];

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: chatMessages,
    max_tokens: 500,
  });

  return completion.choices[0].message.content ?? FALLBACK_REPLY;
}

export const wineAgent = agent('wine-bot', {
  onSubscribe: async ({ subscriber, message, novu }) => {
    const greeting = `Hey ${subscriber.name ?? 'there'}! 🍷 I'm your personal wine sommelier.`;

    if (!message?.text?.trim()) {
      return `${greeting} Ask me anything — pairings, recommendations, regions, you name it.`;
    }

    return generateReply([], message.text, greeting);
  },

  onMessage: async ({ message, conversation, history, novu, subscriber }) => {
    console.log('subscriber data', subscriber);

    const responseText = await generateReply(history, message.text);

    if (/\b(cheers|thanks|thank you)\b/i.test(message.text)) {
      novu.resolve('User said cheers');
    }

    return responseText;
  },

  onResolve: async ({ conversation, subscriber, novu }) => {
    novu.trigger('wine-session-summary', {
      to: { subscriberId: subscriber.subscriberId },
      payload: {
        conversationId: conversation.id,
        messageCount: conversation.state.messageCount,
        recommendationCount: conversation.state.recommendationCount,
        preferences: conversation.state.preferences,
      },
    });
  },

  config: {
    platforms: ['slack', 'whatsapp', 'github', 'resend'],
  },
});
