import { workflow } from '@novu/framework';

export const wineRecommendationsReady = workflow(
  'wine-recommendations-ready',
  async ({ step, payload }) => {
    await step.inApp('notify', async () => ({
      subject: `🍷 Your sommelier picked ${payload.recommendationCount} wines`,
      body: String(payload.lastRecommendation),
    }));
  },
  {
    payloadSchema: {
      type: 'object' as const,
      properties: {
        conversationId: { type: 'string' as const },
        recommendationCount: { type: 'number' as const },
        lastRecommendation: { type: 'string' as const },
      },
      required: ['conversationId', 'recommendationCount', 'lastRecommendation'] as const,
      additionalProperties: false as const,
    },
  }
);

export const wineSessionSummary = workflow(
  'wine-session-summary',
  async ({ step, payload }) => {
    const prefs = Array.isArray(payload.preferences) ? payload.preferences.join(', ') : 'still discovering';

    await step.inApp('summary', async () => ({
      subject: '🎉 Wine session complete',
      body: `You explored ${payload.recommendationCount ?? 0} wines across ${payload.messageCount ?? 0} messages. Taste profile: ${prefs || 'still discovering'}`,
    }));
  },
  {
    payloadSchema: {
      type: 'object' as const,
      properties: {
        conversationId: { type: 'string' as const },
        messageCount: { type: 'number' as const },
        recommendationCount: { type: 'number' as const },
        preferences: { type: 'array' as const, items: { type: 'string' as const } },
      },
      required: ['conversationId'] as const,
      additionalProperties: false as const,
    },
  }
);
