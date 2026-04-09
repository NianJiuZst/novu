import type { Attachment } from 'chat';
import OpenAI from 'openai';

import { type RichResponse } from './agent';
import { type WineRecommendationInput, wineRecommendationBlocks } from './wine-recommendation-blocks';

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
When you have a concrete wine to suggest, call the recommend_wine tool with structured details (exactly one wine — your single best pick). For all other replies, respond in plain text only.
Use a warm, approachable tone — not pretentious.`;

const RECOMMEND_WINE_TOOL: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'recommend_wine',
    description:
      'Recommend a specific wine to the user. Only call this when you have a concrete suggestion with grape, region, and price.',
    parameters: {
      type: 'object',
      required: ['intro', 'name', 'grape', 'region', 'priceRange', 'tastingNotes', 'foodPairing'],
      properties: {
        intro: { type: 'string', description: 'Short intro sentence about why you picked this wine' },
        name: { type: 'string' },
        grape: { type: 'string' },
        region: { type: 'string' },
        priceRange: { type: 'string' },
        tastingNotes: { type: 'string' },
        foodPairing: { type: 'string', description: 'Food pairing or empty string if none' },
      },
    },
  },
};

const FALLBACK_REPLY = 'Hmm, I seem to have lost my train of thought. Could you ask again?';

type ToolCallMerge = Record<number, { id?: string; name?: string; arguments: string }>;

function mergeToolCallDeltas(
  toolCalls: NonNullable<OpenAI.ChatCompletionChunk['choices'][0]['delta']['tool_calls']>,
  acc: ToolCallMerge
): void {
  for (const tc of toolCalls) {
    const idx = tc.index;

    if (acc[idx] === undefined) {
      acc[idx] = { arguments: '' };
    }

    if (tc.id) {
      acc[idx].id = tc.id;
    }

    if (tc.function?.name) {
      acc[idx].name = tc.function.name;
    }

    if (tc.function?.arguments) {
      acc[idx].arguments += tc.function.arguments;
    }
  }
}

function parseRecommendWineTool(acc: ToolCallMerge): WineRecommendationInput | null {
  for (const key of Object.keys(acc)) {
    const entry = acc[Number(key)];

    if (entry?.name === 'recommend_wine' && entry.arguments) {
      try {
        return JSON.parse(entry.arguments) as WineRecommendationInput;
      } catch {
        return null;
      }
    }
  }

  return null;
}

async function attachmentToBuffer(att: Attachment): Promise<Buffer | null> {
  if (att.data) {
    if (Buffer.isBuffer(att.data)) {
      return att.data;
    }

    if (typeof Blob !== 'undefined' && att.data instanceof Blob) {
      const ab = await att.data.arrayBuffer();

      return Buffer.from(ab);
    }
  }

  if (att.fetchData) {
    return att.fetchData();
  }

  return null;
}

async function buildUserContent(
  userMessage: string,
  attachments?: Attachment[]
): Promise<string | OpenAI.ChatCompletionContentPart[]> {
  if (!attachments?.length) {
    return userMessage;
  }

  const fileNotes: string[] = [];
  const imageParts: OpenAI.ChatCompletionContentPart[] = [];

  for (const att of attachments) {
    if (att.type === 'image') {
      const buf = await attachmentToBuffer(att);

      if (buf) {
        const mime = att.mimeType ?? 'image/png';

        imageParts.push({
          type: 'image_url',
          image_url: { url: `data:${mime};base64,${buf.toString('base64')}` },
        });

        continue;
      }

      if (att.url?.startsWith('http')) {
        imageParts.push({
          type: 'image_url',
          image_url: { url: att.url },
        });

        continue;
      }

      fileNotes.push(`[Attached image: could not load${att.name ? ` (${att.name})` : ''}]`);
    } else {
      const name = att.name ?? 'file';
      const size = att.size !== undefined ? ` (${att.size} bytes)` : '';

      fileNotes.push(`[Attached ${att.type}: ${name}${size}]`);
    }
  }

  const textLines = [userMessage, ...fileNotes].filter((line) => line.trim().length > 0);
  const textBlock = textLines.join('\n');

  if (imageParts.length === 0) {
    return textBlock;
  }

  const parts: OpenAI.ChatCompletionContentPart[] = [
    { type: 'text', text: textBlock || '(User sent image attachments.)' },
    ...imageParts,
  ];

  return parts;
}

export async function generateWineReply(
  history: Array<{ text: string; isBot: boolean }>,
  userMessage: string,
  systemPrefix?: string,
  attachments?: Attachment[]
): Promise<string | RichResponse | AsyncIterable<string>> {
  const systemContent = systemPrefix ? `${systemPrefix}\n\n${SYSTEM_PROMPT}` : SYSTEM_PROMPT;

  const userContent = await buildUserContent(userMessage, attachments);

  const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...history.map(
      (m): OpenAI.ChatCompletionMessageParam => ({
        role: m.isBot ? 'assistant' : 'user',
        content: m.text,
      })
    ),
    { role: 'user', content: userContent },
  ];

  const stream = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: chatMessages,
    max_tokens: 800,
    stream: true,
    tools: [RECOMMEND_WINE_TOOL],
    tool_choice: 'auto',
  });

  const chunks: OpenAI.ChatCompletionChunk[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  const toolMerge: ToolCallMerge = {};
  const contentPieces: string[] = [];

  for (const chunk of chunks) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.tool_calls?.length) {
      mergeToolCallDeltas(delta.tool_calls, toolMerge);
    }

    if (delta?.content) {
      contentPieces.push(delta.content);
    }
  }

  const args = parseRecommendWineTool(toolMerge);

  if (args) {
    return wineRecommendationBlocks(args);
  }

  if (contentPieces.length === 0) {
    return FALLBACK_REPLY;
  }

  async function* replayContentStream(): AsyncGenerator<string> {
    for (const piece of contentPieces) {
      yield piece;
    }
  }

  return replayContentStream();
}
