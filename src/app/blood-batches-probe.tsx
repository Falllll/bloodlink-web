'use client';

import { useApiQuery } from '@/lib/api/hooks';
import { messageFor } from '@/lib/api/error-message';
import type { ApiPaginated } from '@/lib/api/types';

type BloodBatch = { id: string };

export function BloodBatchesProbe() {
  const { data, isPending, isError, error } = useApiQuery<ApiPaginated<BloodBatch>>(
    ['blood-batches'],
    '/blood-batches',
  );

  if (isPending) return <p>Memuat...</p>;
  if (isError) return <p>{messageFor(error.body.error.code)}</p>;

  return <p>{data.data.length} baris dimuat.</p>;
}
