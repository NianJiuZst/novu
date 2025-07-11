import type {
  OrganizationPublicMetadata as _OrganizationPublicMetadata,
  UserPublicMetadata as _UserPublicMetadata,
} from '@novu/shared';

declare global {
  interface UserPublicMetadata extends _UserPublicMetadata {}
  interface OrganizationPublicMetadata extends _OrganizationPublicMetadata {}
}
