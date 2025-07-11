import type { IApiKey } from '@novu/shared';
import { useQuery } from '@tanstack/react-query';
import { getApiKeys } from '../api/environment';
import { QueryKeys } from '../api/query.keys';
import { useEnvironment } from '../components/providers/EnvironmentProvider';

export function useApiKeys() {
  const { environment } = useEnvironment();

  return useQuery<IApiKey[]>([QueryKeys.getApiKeys, environment?._id], getApiKeys);
}
