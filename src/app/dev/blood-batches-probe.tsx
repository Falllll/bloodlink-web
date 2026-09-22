'use client';

import { useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/api/hooks';
import type { ApiPaginated } from '@/lib/api/types';
import { translateApiError } from '@/lib/errors/translate-api-error';

type BloodBatch = { id: string };

export function BloodBatchesProbe() {
  const t = useTranslations();
  const { data, isPending, isError, error } = useApiQuery<ApiPaginated<BloodBatch>>(
    ['blood-batches'],
    '/blood-batches',
  );

  if (isPending) return <p>Memuat...</p>;
  if (isError) return <p>{translateApiError(error.body, t).summary}</p>;

  return <p>{data.data.length} baris dimuat.</p>;
}
