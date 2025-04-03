import React from 'react';
import { ClerkIcon } from './clerk-icon';
import { StripeIcon } from './stripe-icon';

export enum IntegrationType {
  STRIPE = 'stripe',
  CLERK = 'clerk',
}

export interface IntegrationIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export interface IntegrationConfig {
  type: IntegrationType;
  icon: React.FC<IntegrationIconProps>;
  displayName: string;
}

export const INTEGRATIONS: Record<IntegrationType, IntegrationConfig> = {
  [IntegrationType.STRIPE]: {
    type: IntegrationType.STRIPE,
    icon: StripeIcon,
    displayName: 'Stripe',
  },
  [IntegrationType.CLERK]: {
    type: IntegrationType.CLERK,
    icon: ClerkIcon,
    displayName: 'Clerk',
  },
};

export function getIntegrationIcon(integrationType: IntegrationType): React.FC<IntegrationIconProps> | null {
  return INTEGRATIONS[integrationType]?.icon || null;
}

export function getIntegrationDisplayName(integrationType: IntegrationType): string {
  return INTEGRATIONS[integrationType]?.displayName || integrationType;
}

export * from './clerk-icon';
export * from './stripe-icon';
