'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { NearbyStockEntry, NearbyStockStatus } from '@/lib/api/blood-requests';

const NOTE = 'text-sm text-[color:var(--color-ink-soft)]';

export function NearbyStockResult({ status, entries }: { status: NearbyStockStatus; entries: NearbyStockEntry[] }) {
  const t = useTranslations('dashboard.nearby');
  const format = useFormatter();

  // Dua status pertama berarti pindaian TIDAK berjalan: daftar kosongnya tidak
  // punya arti dan tidak boleh dibaca sebagai "tidak ada stok".
  let body: React.ReactNode;
  if (status === 'no_requester_location') {
    body = <p role="status" className={NOTE}>{t('noRequesterLocation')}</p>;
  } else if (status === 'no_sourced_rule') {
    body = <p role="status" className={NOTE}>{t('noSourcedRule')}</p>;
  } else if (entries.length === 0) {
    body = <p role="status" className={NOTE}>{t('noneInRadius')}</p>;
  } else {
    body = (
      <ul className="divide-y divide-border">
        {entries.map((entry) => (
          <li key={entry.facility_id} className="flex items-center justify-between gap-4 py-2 text-sm">
            <div className="text-[color:var(--color-ink)]">
              <span>{entry.facility_name}</span>
              {entry.is_self && (
                <span className="ml-2 text-xs text-[color:var(--color-ink-muted)]">{t('self')}</span>
              )}
              <div className="text-xs text-[color:var(--color-ink-muted)]">
                {format.number(entry.distance_meters / 1000, {
                  style: 'unit',
                  unit: 'kilometer',
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </div>
            </div>
            <span className="whitespace-nowrap text-[color:var(--color-ink-strong)]">
              {t('units', { count: entry.compatible_units })}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section>
      <h3 className="font-display text-base font-semibold text-[color:var(--color-ink-strong)]">{t('heading')}</h3>
      <div className="mt-3">{body}</div>
    </section>
  );
}
