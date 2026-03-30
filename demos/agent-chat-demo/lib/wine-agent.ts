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
Use a warm, approachable tone — not pretentious.`;

export const wineAgent = agent('wine-bot', {
  onSubscribe: async ({ subscriber, novu }) => {
    novu.state.set({ preferences: [], recommendationCount: 0, messageCount: 0 });

    return `Hey ${subscriber.name ?? 'there'}! 🍷 I'm your personal wine sommelier. Ask me anything — pairings, recommendations, regions, you name it.`;
  },

  onMessage: async ({ message, conversation, history, novu, subscriber }) => {
    console.log('subscriber!!', subscriber);
    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(
        (m): OpenAI.ChatCompletionMessageParam => ({
          role: m.isBot ? 'assistant' : 'user',
          content: m.text,
        })
      ),
      { role: 'user', content: message.text },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      max_tokens: 500,
    });

    const responseText =
      completion.choices[0].message.content ?? 'Hmm, I seem to have lost my train of thought. Could you ask again?';
    novu.state.increment('messageCount');

    const madeRecommendation = /\$\d+|\bregion\b|\bvineyard\b|\bwinery\b|\bgrape\b/i.test(responseText);
    if (madeRecommendation) {
      novu.state.increment('recommendationCount');

      const recCount = ((conversation.state.recommendationCount as number) ?? 0) + 1;
      if (recCount >= 3) {
        novu.trigger('wine-recommendations-ready', {
          to: { subscriberId: subscriber.subscriberId },
          payload: {
            conversationId: conversation.id,
            recommendationCount: recCount,
            lastRecommendation: responseText.slice(0, 200),
          },
        });
      }
    }

    const tasteKeywords = ['dry', 'sweet', 'bold', 'light', 'fruity', 'oaky', 'tannic', 'crisp'];
    const mentioned = tasteKeywords.filter((k) => message.text.toLowerCase().includes(k));
    if (mentioned.length > 0) {
      const current = (conversation.state.preferences as string[]) ?? [];
      const updated = [...new Set([...current, ...mentioned])];
      novu.state.set({ preferences: updated });
    }

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
    platforms: ['slack'],
  },
});
