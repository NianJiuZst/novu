import type {
  OrganizationPublicMetadata as _OrganizationPublicMetadata,
  UserPublicMetadata as _UserPublicMetadata,
} from '@novu/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface UserPublicMetadata extends _UserPublicMetadata {}

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface OrganizationPublicMetadata extends _OrganizationPublicMetadata {}
}
