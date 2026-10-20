'use client';

import { useId, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/api/hooks';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { Button } from '@/components/ui/button';
import { StatusChip, toChipStatus } from '@/components/ui/status-chip';
import {
  BATCH_STATUSES,
  BLOOD_GROUPS,
  COMPONENTS,
  RH_FACTORS,
  buildBloodBatchPath,
  type BatchStatusValue,
  type BloodBatch,
  type BloodBatchFilters,
  type BloodBatchPage,
  type BloodGroup,
  type ComponentValue,
  type RhFactor,
} from '@/lib/api/blood-batches';

const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const HEAD = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]';
const CELL = 'px-3 py-2 align-top';
const SELECT =
  'h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export function InventoryTable() {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const format = useFormatter();
  const id = useId();

  const [filters, setFilters] = useState<BloodBatchFilters>({});
  const [cursor, setCursor] = useState<string | null>(null);

  const { data, isPending, isError, error } = useApiQuery<BloodBatchPage>(
    ['blood-batches', filters, cursor],
    buildBloodBatchPath(filters, cursor),
  );

  // Cursor buram milik kombinasi filter lama; memakainya pada filter baru
  // menampilkan baris dari jendela yang salah. Setiap perubahan filter WAJIB reset.
  function updateFilter<K extends keyof BloodBatchFilters>(key: K, value: BloodBatchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCursor(null);
  }

  function resetFilters() {
    setFilters({});
    setCursor(null);
  }

  const prevCursor = data?.meta.prev_cursor ?? null;
  const nextCursor = data?.meta.has_more ? (data.meta.next_cursor ?? null) : null;

  function groupLabel(batch: BloodBatch): string {
    if (batch.blood_group === null || batch.rh_factor === null) return t('dashboard.inventory.untyped');
    return t('dashboard.inventory.groupValue', {
      group: batch.blood_group,
      rh: t(`dashboard.rh.${batch.rh_factor}`),
    });
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]">
        {t('dashboard.inventory.heading')}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-status`} className={LABEL}>
            {t('dashboard.inventory.filters.status')}
          </label>
          <select
            id={`${id}-status`}
            value={filters.status ?? ''}
            onChange={(e) => updateFilter('status', (e.target.value || undefined) as BatchStatusValue | undefined)}
            className={SELECT}
          >
            <option value="">{t('dashboard.inventory.filters.all')}</option>
            {BATCH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`dashboard.status.${status}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-component`} className={LABEL}>
            {t('dashboard.inventory.filters.component')}
          </label>
          <select
            id={`${id}-component`}
            value={filters.component ?? ''}
            onChange={(e) => updateFilter('component', (e.target.value || undefined) as ComponentValue | undefined)}
            className={SELECT}
          >
            <option value="">{t('dashboard.inventory.filters.all')}</option>
            {COMPONENTS.map((component) => (
              <option key={component} value={component}>
                {t(`dashboard.component.${component}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-group`} className={LABEL}>
            {t('dashboard.inventory.filters.bloodGroup')}
          </label>
          <select
            id={`${id}-group`}
            value={filters.bloodGroup ?? ''}
            onChange={(e) => updateFilter('bloodGroup', (e.target.value || undefined) as BloodGroup | undefined)}
            className={SELECT}
          >
            <option value="">{t('dashboard.inventory.filters.all')}</option>
            {BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-rh`} className={LABEL}>
            {t('dashboard.inventory.filters.rhFactor')}
          </label>
          <select
            id={`${id}-rh`}
            value={filters.rhFactor ?? ''}
            onChange={(e) => updateFilter('rhFactor', (e.target.value || undefined) as RhFactor | undefined)}
            className={SELECT}
          >
            <option value="">{t('dashboard.inventory.filters.all')}</option>
            {RH_FACTORS.map((rh) => (
              <option key={rh} value={rh}>
                {t(`dashboard.rh.${rh}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
          {t('dashboard.inventory.filters.reset')}
        </Button>
      </div>

      <div className="mt-6">
        {isPending ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('dashboard.inventory.loading')}
          </p>
        ) : isError ? (
          <p role="alert" className="py-8 text-center text-sm text-[color:var(--color-ink-soft)]">
            {translateApiError(error.body, t).summary}
          </p>
        ) : data.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('dashboard.inventory.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={HEAD}>{t('dashboard.inventory.column.batchNumber')}</th>
                  <th className={HEAD}>{t('dashboard.inventory.column.component')}</th>
                  <th className={HEAD}>{t('dashboard.inventory.column.group')}</th>
                  <th className={HEAD}>{t('dashboard.inventory.column.volume')}</th>
                  <th className={HEAD}>{t('dashboard.inventory.column.status')}</th>
                  <th className={HEAD}>{t('dashboard.inventory.column.collectedAt')}</th>
                  <th className={HEAD}>{t('dashboard.inventory.column.expiresAt')}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((batch) => (
                  <tr key={batch.id} className="border-b border-border text-[color:var(--color-ink)]">
                    <td className={`${CELL} font-mono text-xs`}>{batch.batch_number}</td>
                    <td className={CELL}>{t(`dashboard.component.${batch.component}`)}</td>
                    <td className={CELL}>{groupLabel(batch)}</td>
                    <td className={`${CELL} whitespace-nowrap`}>
                      {format.number(batch.volume_ml, { style: 'unit', unit: 'milliliter' })}
                    </td>
                    <td className={CELL}>
                      <StatusChip status={toChipStatus(batch.status)} />
                    </td>
                    <td className={`${CELL} whitespace-nowrap`}>
                      {format.dateTime(new Date(batch.collected_at), { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className={`${CELL} whitespace-nowrap`}>
                      {batch.expires_at === null
                        ? t('dashboard.inventory.none')
                        : format.dateTime(new Date(batch.expires_at), { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={prevCursor === null}
          onClick={() => setCursor(prevCursor)}
        >
          {t('dashboard.inventory.prev')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={nextCursor === null}
          onClick={() => setCursor(nextCursor)}
        >
          {t('dashboard.inventory.next')}
        </Button>
      </div>
    </div>
  );
}
