import { Chat } from 'chat';
import { createSlackAdapter } from '@chat-adapter/slack';
import { createRedisState } from '@chat-adapter/state-redis';
import { Novu } from '@novu/node';
import { executeSignals, type AgentInstance } from './agent';
import { getOrCreateConversation, saveConversation } from './conversation-store';
import { wineAgent } from './wine-agent';

let _novuClient: Novu | null = null;
function getNovuClient(): Novu {
  if (!_novuClient) {
    _novuClient = new Novu(process.env.NOVU_SECRET_KEY!);
  }

  return _novuClient;
}

const adapters = {
  slack: createSlackAdapter(),
};

export const bot = new Chat({
  userName: 'wine-bot',
  adapters,
  state: createRedisState(),
  onLockConflict: 'force',
});

async function buildHistory(thread: any): Promise<Array<{ text: string; isBot: boolean; timestamp: string }>> {
  const messages: Array<{ text: string; isBot: boolean; timestamp: string }> = [];

  for await (const msg of thread.allMessages) {
    messages.push({
      text: msg.text,
      isBot: msg.author.isMe,
      timestamp: msg.metadata?.dateSent?.toISOString() ?? new Date().toISOString(),
    });
  }

  return messages;
}

function getResponseText(response: string | { text: string } | void): string {
  if (!response) return '';
  if (typeof response === 'string') return response;

  return response.text;
}

bot.onNewMention(async (thread, message) => {
  console.log(`[wine-bot] New mention from ${message.author.fullName} in ${thread.id}`);

  await thread.subscribe();

  const conversation = getOrCreateConversation(thread.id, message.author.userId);
  if (!conversation.participants.includes(message.author.userId)) {
    conversation.participants.push(message.author.userId);
  }

  const subscriber = {
    subscriberId: message.author.userId,
    name: message.author.fullName,
  };

  const { response, signals } = await wineAgent.handleSubscribe({
    conversation,
    subscriber,
    message: { text: message.text, author: message.author },
  });

  const text = getResponseText(response);
  if (text) {
    await thread.post(text);
  }

  await executeSignals(signals, conversation, saveConversation, getNovuClient());

  const hasResolve = signals.some((s) => s.type === 'resolve');
  if (hasResolve) {
    const { signals: resolveSignals } = await wineAgent.handleResolve({ conversation, subscriber });
    await executeSignals(resolveSignals, conversation, saveConversation, getNovuClient());
    await thread.unsubscribe();
  }
});

bot.onSubscribedMessage(async (thread, message) => {
  console.log(`[wine-bot] Message from ${message.author.fullName}: ${message.text.slice(0, 80)}`);

  const conversation = getOrCreateConversation(thread.id, message.author.userId);
  if (!conversation.participants.includes(message.author.userId)) {
    conversation.participants.push(message.author.userId);
  }

  const subscriber = {
    subscriberId: message.author.userId,
    name: message.author.fullName,
  };

  const history = await buildHistory(thread);

  await thread.startTyping();

  const { response, signals } = await wineAgent.handleMessage({
    message: { text: message.text, author: message.author },
    conversation,
    subscriber,
    history: history.slice(0, -1),
  });

  const text = getResponseText(response);
  if (text) {
    await thread.post(text);
  }

  await executeSignals(signals, conversation, saveConversation, getNovuClient());

  const hasResolve = signals.some((s) => s.type === 'resolve');
  if (hasResolve) {
    const { signals: resolveSignals } = await wineAgent.handleResolve({ conversation, subscriber });
    await executeSignals(resolveSignals, conversation, saveConversation, getNovuClient());
    await thread.unsubscribe();
  }
});
