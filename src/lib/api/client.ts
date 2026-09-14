import type { ApiError } from './types';

export class ApiFailure extends Error {
  constructor(public readonly status: number, public readonly body: ApiError) {
    super(body.error.code);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/bff${path}`, init);

  if (!res.ok) {
    const body = (await res.json()) as ApiError;
    throw new ApiFailure(res.status, body);
  }

  return (await res.json()) as T;
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
