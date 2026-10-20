'use client';

import { useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/api/hooks';
import type { BloodBatchPage } from '@/lib/api/blood-batches';
import { translateApiError } from '@/lib/errors/translate-api-error';

export function BloodBatchesProbe() {
  const t = useTranslations();
  const { data, isPending, isError, error } = useApiQuery<BloodBatchPage>(
    ['blood-batches'],
    '/blood-batches',
  );

  if (isPending) return <p>Memuat...</p>;
  if (isError) return <p>{translateApiError(error.body, t).summary}</p>;

  return <p>{data.data.length} baris dimuat.</p>;
}
