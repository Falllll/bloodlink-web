export type ErrorCode =
  | 'VALIDATION_FAILED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND'
  | 'INTERNAL_ERROR' | 'METHOD_NOT_ALLOWED' | 'TOO_MANY_REQUESTS' | 'HTTP_ERROR'
  | 'IDEMPOTENCY_KEY_REQUIRED' | 'IDEMPOTENCY_KEY_REUSED' | 'REQUEST_IN_PROGRESS';

export type ApiError = {
  error: { code: ErrorCode; message: string; details: Record<string, unknown>; trace_id: string };
};

export type ApiSuccess<T> = { data: T; meta: Record<string, unknown> };

export type ApiPaginated<T> = {
  data: T[];
  meta: { per_page: number; next_cursor: string | null; prev_cursor: string | null; has_more: boolean };
  links: { next: string | null; prev: string | null };
};

export type Role = 'donor' | 'hospital_staff' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type LoginResult = { user: AuthUser };
