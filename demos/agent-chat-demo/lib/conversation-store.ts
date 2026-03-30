import type { Conversation } from './agent';

type StoredConversation = Conversation & {
  createdAt: Date;
  lastMessageAt: Date;
};

const store = new Map<string, StoredConversation>();

export function getOrCreateConversation(threadId: string, participantId: string): Conversation {
  const existing = store.get(threadId);
  if (existing) {
    return existing;
  }

  const conversation: StoredConversation = {
    id: threadId,
    state: {},
    participants: [participantId],
    status: 'active',
    createdAt: new Date(),
    lastMessageAt: new Date(),
  };

  store.set(threadId, conversation);

  return conversation;
}

export function saveConversation(conversation: Conversation) {
  const stored = store.get(conversation.id);
  if (stored) {
    Object.assign(stored, conversation);
    stored.lastMessageAt = new Date();
  } else {
    store.set(conversation.id, { ...conversation, createdAt: new Date(), lastMessageAt: new Date() });
  }
}

export function getConversation(threadId: string): Conversation | undefined {
  return store.get(threadId);
}
