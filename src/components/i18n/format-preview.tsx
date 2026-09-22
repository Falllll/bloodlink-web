'use client';

import { useFormatter, useTranslations } from 'next-intl';

export function FormatPreview({ km, at }: { km: number; at: Date }) {
  const format = useFormatter();
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1 text-sm text-[color:var(--color-ink-soft)]">
      <p>{format.number(km, { style: 'unit', unit: 'kilometer', maximumFractionDigits: 1 })}</p>
      <p>{format.dateTime(at, { dateStyle: 'long', timeStyle: 'short' })}</p>
      <p>{format.number(1234567.5)}</p>
      <p>{t('medical.eligibility.minIntervalDays', { days: 60 })}</p>
    </div>
  );
}
