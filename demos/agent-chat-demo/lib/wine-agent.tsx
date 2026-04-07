/** @jsxImportSource chat */
import { Actions, Button, Card, CardText, Divider, Field, Fields, Section, type ChatElement } from 'chat';
import OpenAI from 'openai';

import { agent, type RichResponse } from './agent';

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
If the user's request is vague (e.g. "recommend a wine"), ask a short clarifying question about their preferences — occasion, food pairing, budget, or flavor profile — before making a recommendation.
When recommending, suggest exactly ONE wine — your single best pick for the situation.
Use a warm, approachable tone — not pretentious.

IMPORTANT: You MUST respond with valid JSON. Every response has all fields — use "type" to indicate the kind of reply.

For conversational replies (questions, clarifications, general chat):
{ "type": "text", "content": "your message here", "intro": "", "wines": [] }

For specific wine recommendations:
{
  "type": "recommendation",
  "content": "",
  "intro": "A short intro sentence about why you're recommending these",
  "wines": [
    {
      "name": "Wine Name",
      "grape": "Grape variety",
      "region": "Region, Country",
      "priceRange": "$XX–$YY",
      "tastingNotes": "Brief tasting notes",
      "foodPairing": "What it pairs well with, or empty string if none"
    }
  ]
}

Only use "recommendation" when you have specific wines to suggest. Use "text" for everything else.`;

type WineRecommendation = {
  name: string;
  grape: string;
  region: string;
  priceRange: string;
  tastingNotes: string;
  foodPairing: string;
};

type AiResponse = {
  type: 'text' | 'recommendation';
  content: string;
  intro: string;
  wines: WineRecommendation[];
};

const RESPONSE_SCHEMA: OpenAI.ResponseFormatJSONSchema['json_schema'] = {
  name: 'wine_response',
  strict: true,
  schema: {
    type: 'object',
    required: ['type', 'content', 'intro', 'wines'],
    additionalProperties: false,
    properties: {
      type: { type: 'string', enum: ['text', 'recommendation'] },
      content: { type: 'string' },
      intro: { type: 'string' },
      wines: {
        type: 'array',
        maxItems: 1,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            grape: { type: 'string' },
            region: { type: 'string' },
            priceRange: { type: 'string' },
            tastingNotes: { type: 'string' },
            foodPairing: { type: 'string' },
          },
          required: ['name', 'grape', 'region', 'priceRange', 'tastingNotes', 'foodPairing'],
          additionalProperties: false,
        },
      },
    },
  },
};

const FALLBACK_REPLY = 'Hmm, I seem to have lost my train of thought. Could you ask again?';

function renderWineCard(rec: AiResponse): ChatElement {
  return (
    <Card title="🍷 Wine Recommendation">
      <CardText>{rec.intro}</CardText>
      {rec.wines.map((wine, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Section key={i}>
          <Divider />
          <CardText style="bold">{wine.name}</CardText>
          <Fields>
            <Field label="Grape" value={wine.grape} />
            <Field label="Region" value={wine.region} />
            <Field label="Price" value={wine.priceRange} />
            {wine.foodPairing ? <Field label="Pairs with" value={wine.foodPairing} /> : null}
          </Fields>
          <CardText>{wine.tastingNotes}</CardText>
          <Actions>
            <Button id={`buy_wine_${i}`} style="primary" value={wine.name}>🛒 Buy Now</Button>
          </Actions>
        </Section>
      ))}
    </Card>
  );
}

function recommendationToPlainText(rec: AiResponse): string {
  const lines = [rec.intro, ''];

  for (const wine of rec.wines) {
    lines.push(
      `*${wine.name}*`,
      `  Grape: ${wine.grape} · Region: ${wine.region} · Price: ${wine.priceRange}`,
      `  ${wine.tastingNotes}`
    );

    if (wine.foodPairing) {
      lines.push(`  🍽️ Pairs with: ${wine.foodPairing}`);
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

function parseAiResponse(raw: string): AiResponse {
  try {
    return JSON.parse(raw) as AiResponse;
  } catch {
    return { type: 'text', content: raw, intro: '', wines: [] };
  }
}

async function generateReply(
  history: Array<{ text: string; isBot: boolean }>,
  userMessage: string,
  systemPrefix?: string
): Promise<string | RichResponse> {
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
    max_tokens: 800,
    response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
  });

  const rawContent = completion.choices[0].message.content;

  if (!rawContent) {
    return FALLBACK_REPLY;
  }

  const aiResponse = parseAiResponse(rawContent);

  if (aiResponse.type === 'recommendation') {
    return {
      text: recommendationToPlainText(aiResponse),
      card: renderWineCard(aiResponse),
    };
  }

  return aiResponse.content;
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

    const response = await generateReply(history, message.text);

    if (/\b(cheers|thanks|thank you)\b/i.test(message.text)) {
      novu.resolve('User said cheers');
    }

    return response;
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
