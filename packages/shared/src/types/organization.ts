export type OrganizationId = string;

export enum ApiServiceLevelEnum {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
  UNLIMITED = 'unlimited',
}

export enum StripeBillingIntervalEnum {
  MONTH = 'month',
  YEAR = 'year',
}

export enum ProductUseCasesEnum {
  IN_APP = 'in_app',
  MULTI_CHANNEL = 'multi_channel',
  DELAY = 'delay',
  TRANSLATION = 'translation',
  DIGEST = 'digest',
}

export type ProductUseCases = Partial<Record<ProductUseCasesEnum, boolean>>;

export enum IndustryEnum {
  ECOMMERCE = 'ecommerce',
  FINTECH = 'fintech',
  HEALTHCARE = 'healthcare',
  SAAS = 'saas',
  EDUCATION = 'education',
  MEDIA = 'media',
  SOCIAL = 'social',
  GAMING = 'gaming',
  OTHER = 'other',
}

export const industryToLabelMapper: Record<IndustryEnum, string> = {
  [IndustryEnum.ECOMMERCE]: 'E-commerce',
  [IndustryEnum.FINTECH]: 'Fintech',
  [IndustryEnum.HEALTHCARE]: 'Healthcare',
  [IndustryEnum.SAAS]: 'SaaS',
  [IndustryEnum.EDUCATION]: 'Education',
  [IndustryEnum.MEDIA]: 'Media & Entertainment',
  [IndustryEnum.SOCIAL]: 'Social',
  [IndustryEnum.GAMING]: 'Gaming',
  [IndustryEnum.OTHER]: 'Other',
};

export type OrganizationPublicMetadata = {
  externalOrgId?: string;
  domain?: string;
  productUseCases?: ProductUseCases;
  language?: string[];
  defaultLocale?: string;
  companySize?: string;
};
