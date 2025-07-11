import type { IOrganizationEntity } from '@novu/shared';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '../api/organization';

export function useOrganizations() {
  return useQuery<IOrganizationEntity[]>(['/v1/organizations'], getOrganizations);
}
