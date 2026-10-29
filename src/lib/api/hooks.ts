'use client';

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiFetch, ApiFailure } from './client';
import { onUnauthenticated } from './on-unauthenticated';
import type { ApiPaginated } from './types';

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

export type CursorPages<T> = { items: T[]; truncated: boolean };

// Menelusuri paginasi kursor sampai habis, tetapi dengan dua rem: paling banyak
// maxPages halaman, dan berhenti kalau backend mengembalikan cursor yang sudah
// pernah dipakai (bug backend tidak boleh jadi loop tanpa akhir di browser).
// truncated = masih ada halaman yang TIDAK diambil; jangan sajikan items sebagai total.
export function useApiCursorPages<T>(
  key: readonly unknown[],
  pathFor: (cursor: string | null) => string,
  maxPages: number,
) {
  return useQuery<CursorPages<T>, ApiFailure>({
    queryKey: key,
    queryFn: async () => {
      const items: T[] = [];
      const seen = new Set<string>();
      let cursor: string | null = null;

      try {
        for (let page = 0; page < maxPages; page++) {
          const res: ApiPaginated<T> = await apiFetch<ApiPaginated<T>>(pathFor(cursor));
          items.push(...res.data);

          const next = res.meta.has_more ? res.meta.next_cursor : null;
          if (next === null) return { items, truncated: false };
          if (next === cursor || seen.has(next)) return { items, truncated: true };

          seen.add(next);
          cursor = next;
        }
      } catch (error) {
        if (error instanceof ApiFailure && error.status === 401) {
          await onUnauthenticated();
        }
        throw error;
      }

      return { items, truncated: true };
    },
  });
}

export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    redirectOnUnauthenticated?: boolean;
    onSuccess?: (data: TData, variables: TVariables) => void;
  },
) {
  return useMutation<TData, ApiFailure, TVariables>({
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        if (
          error instanceof ApiFailure &&
          error.status === 401 &&
          (options?.redirectOnUnauthenticated ?? true)
        ) {
          await onUnauthenticated();
        }
        throw error;
      }
    },
    onSuccess: options?.onSuccess,
  });
}
