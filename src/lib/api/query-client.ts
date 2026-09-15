import { QueryClient } from '@tanstack/react-query';
import { ApiFailure } from './client';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiFailure && error.status < 500) return false;
          return failureCount < 3;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
