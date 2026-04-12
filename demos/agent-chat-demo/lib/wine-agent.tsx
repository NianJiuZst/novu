import { agent } from './agent';
import { generateWineReply } from './wine-agent-reply';

export { type WineRecommendationInput, wineRecommendationBlocks } from './wine-recommendation-blocks';

export const wineAgent = agent('wine-bot', {
  onSubscribe: async ({ subscriber, message }) => {
    const greeting = `Hey ${subscriber.name ?? 'there'}! 🍷 I'm your personal wine sommelier.`;

    if (!message?.text?.trim()) {
      return `${greeting} Ask me anything — pairings, recommendations, regions, you name it.`;
    }

    return generateWineReply([], message.text, greeting, message.attachments);
  },

  onMessage: async ({ message, history, novu, subscriber }) => {
    const response = await generateWineReply(history, message.text, undefined, message.attachments);

    if (/\b(cheers|thanks|thank you)\b/i.test(message.text)) {
      novu.resolve('User said cheers');
    }

    return response;
  },

  actions: [{ ids: 'buy_wine', handler: onBuyWineAction }],

  config: {
    platforms: ['slack', 'whatsapp', 'github', 'resend', 'gchat'],
  },
});

function buildFakeShipmentConfirmation(wineName: string): string {
  const tracking = `NVU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  return [
    `📦 *Shipment confirmed* — ${wineName}`,
    '',
    `• Tracking: \`${tracking}\``,
    '• Carrier: Novu Express *(demo)*',
    '• Estimated delivery: 3–5 business days',
    '',
    '_Demo only — no payment or real shipment._',
  ].join('\n');
}

async function onBuyWineAction(event: any) {
  if (!event.thread) {
    return;
  }

  const wineName = event.value?.trim() || 'your selection';

  await event.thread.post(buildFakeShipmentConfirmation(wineName));
}
