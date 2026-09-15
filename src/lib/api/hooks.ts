'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiFetch, ApiFailure } from './client';
import { onUnauthenticated } from './on-unauthenticated';

export function useApiQuery<T>(
  key: readonly unknown[],
  path: string,
  options?: Omit<UseQueryOptions<T, ApiFailure>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, ApiFailure>({
    queryKey: key,
    queryFn: async () => {
      try {
        return await apiFetch<T>(path);
      } catch (error) {
        if (error instanceof ApiFailure && error.status === 401) {
          await onUnauthenticated();
        }
        throw error;
      }
    },
    ...options,
  });
}
