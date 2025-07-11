import type { ChangePropsValueType } from '../../types/helpers';
import type { EnvironmentId } from '../environment';
import type { OrganizationId } from '../organization';

export enum TranslationStatusEnum {
  UP_TO_DATE = 'up-to-date',
  OUTDATED = 'outdated',
  UNKNOWN = 'unknown',
}

export class LocalizationEntity {
  _id: string;

  locale: string;
  content: string;
  _localizationGroupId: string;
  _environmentId: EnvironmentId;
  _organizationId: OrganizationId;

  // Translation status tracking
  status: TranslationStatusEnum;
  missingKeys?: string[];

  createdAt: string;
  updatedAt: string;
}

export type LocalizationDBModel = ChangePropsValueType<
  LocalizationEntity,
  '_environmentId' | '_organizationId' | '_localizationGroupId'
>;
