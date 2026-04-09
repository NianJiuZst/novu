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

  onMessage: async ({ message, history, novu }) => {
    const response = await generateWineReply(history, message.text, undefined, message.attachments);

    if (/\b(cheers|thanks|thank you)\b/i.test(message.text)) {
      novu.resolve('User said cheers');
    }

    return response;
  },

  config: {
    platforms: ['slack', 'whatsapp', 'github', 'resend', 'gchat'],
  },
});
