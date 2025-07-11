import { useQuery } from '@tanstack/react-query';
import { type GetOrganizationSettingsDto, getOrganizationSettings } from '../organization';

export const useFetchOrganizationSettings = () => {
  const query = useQuery<{ data: GetOrganizationSettingsDto }>({
    queryKey: ['organizationSettings'],
    queryFn: async () => await getOrganizationSettings(),
  });

  return query;
};
