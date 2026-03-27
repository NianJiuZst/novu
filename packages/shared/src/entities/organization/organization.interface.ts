import { ApiServiceLevelEnum, IndustryEnum, ProductUseCases } from '../../types';

export interface IOrganizationEntity {
  _id: string;
  name: string;
  apiServiceLevel?: ApiServiceLevelEnum;
  isTrial?: boolean;
  branding?: {
    color: string;
    logo: string;
    fontColor?: string;
    fontFamily?: string;
    contentBackground?: string;
    direction?: 'ltr' | 'rtl';
  };
  defaultLocale?: string;
  targetLocales?: string[];
  domain?: string;
  productUseCases?: ProductUseCases;
  industry?: IndustryEnum;
  language?: string[];
  removeNovuBranding?: boolean;
  createdAt: string;
  updatedAt: string;
  externalId?: string;
  stripeCustomerId?: string;
  createdBy?: string;
}
