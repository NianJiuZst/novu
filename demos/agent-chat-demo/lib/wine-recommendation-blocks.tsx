/** @jsxImportSource chat */
import {
  Actions,
  Button,
  Card,
  CardText,
  type ChatElement,
  Divider,
  Field,
  Fields,
  Section,
} from './novu-blocks';

import { type RichResponse } from './agent';

export interface WineRecommendationInput {
  intro: string;
  name: string;
  grape: string;
  region: string;
  priceRange: string;
  tastingNotes: string;
  foodPairing: string;
}

function renderWineCard(rec: WineRecommendationInput): ChatElement {
  return (
    <Card title="🍷 Wine Recommendation">
      <CardText>{rec.intro}</CardText>
      <Section>
        <Divider />
        <CardText style="bold">{rec.name}</CardText>
        <Fields>
          <Field label="Grape" value={rec.grape} />
          <Field label="Region" value={rec.region} />
          <Field label="Price" value={rec.priceRange} />
          {rec.foodPairing ? <Field label="Pairs with" value={rec.foodPairing} /> : null}
        </Fields>
        <CardText>{rec.tastingNotes}</CardText>
        <Actions>
          <Button id="buy_wine_0" style="primary" value={rec.name}>
            🛒 Buy Now
          </Button>
        </Actions>
      </Section>
    </Card>
  );
}

function recommendationToPlainText(rec: WineRecommendationInput): string {
  const lines = [
    rec.intro,
    '',
    `*${rec.name}*`,
    `  Grape: ${rec.grape} · Region: ${rec.region} · Price: ${rec.priceRange}`,
    `  ${rec.tastingNotes}`,
  ];

  if (rec.foodPairing) {
    lines.push(`  Pairs with: ${rec.foodPairing}`);
  }

  return lines.join('\n').trim();
}

export function wineRecommendationBlocks(rec: WineRecommendationInput): RichResponse {
  return {
    text: recommendationToPlainText(rec),
    card: renderWineCard(rec),
  };
}
