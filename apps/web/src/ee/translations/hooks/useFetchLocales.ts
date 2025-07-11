import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../../../api';
import type { ILocale } from '../components/shared';

export const useFetchLocales = (options: UseQueryOptions<ILocale[], any, ILocale[]> = {}) => {
  const { data: locales, ...rest } = useQuery<ILocale[], any, ILocale[]>(
    ['locales'],
    () => api.get('/v1/translations/locales'),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      ...options,
    }
  );

  const getLocale = (isoLanguage: string) => {
    return locales?.find((locale) => locale.langIso === isoLanguage);
  };

  return {
    locales,
    getLocale,
    ...rest,
  };
};
