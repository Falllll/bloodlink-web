import type { ApiError, ValidationFailure } from '@/lib/api/types';

export type Translate = {
  (key: string, values?: Record<string, string | number>): string;
  has: (key: string) => boolean;
};

export type TranslatedApiError = { summary: string; fields: Record<string, string[]> };

export function translateApiError(body: ApiError, t: Translate): TranslatedApiError {
  const code = body.error.code;
  const summary = t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.unknown');

  const fields: Record<string, string[]> = {};

  if (code === 'VALIDATION_FAILED') {
    for (const [field, failures] of Object.entries(body.error.details)) {
      fields[field] = failures.map((failure) => translateFailure(field, failure, t));
    }
  }

  return { summary, fields };
}

export function translateFailure(field: string, failure: ValidationFailure, t: Translate): string {
  const label = t.has(`fields.${field}`) ? t(`fields.${field}`) : field;

  const values: Record<string, string | number> = { field: label };

  if (!Array.isArray(failure.params)) {
    for (const [key, value] of Object.entries(failure.params)) {
      values[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  }

  const key = t.has(`validation.${failure.rule}`) ? `validation.${failure.rule}` : 'validation.unknown';

  return t(key, values);
}
