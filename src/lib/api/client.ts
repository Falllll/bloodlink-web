import type { ApiError } from './types';

export class ApiFailure extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiError,
    public readonly raw?: unknown,
  ) {
    super((body as Partial<ApiError>)?.error?.code ?? 'INTERNAL_ERROR');
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/bff${path}`, init);

  if (!res.ok) {
    let body: ApiError;
    let raw: unknown;
    try {
      const parsed: unknown = await res.json();
      raw = parsed;
      if ((parsed as Partial<ApiError>)?.error?.code) {
        body = parsed as ApiError;
      } else {
        body = {
          error: { code: 'INTERNAL_ERROR', message: res.statusText, details: {}, trace_id: '' },
        };
      }
    } catch {
      body = {
        error: { code: 'INTERNAL_ERROR', message: res.statusText, details: {}, trace_id: '' },
      };
    }
    throw new ApiFailure(res.status, body, raw);
  }

  return (await res.json()) as T;
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
