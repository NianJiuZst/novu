import { serve } from '@novu/framework/next';
import { wineRecommendationsReady, wineSessionSummary } from '@/lib/workflows';

export const { GET, POST, OPTIONS } = serve({
  workflows: [wineRecommendationsReady, wineSessionSummary],
});
