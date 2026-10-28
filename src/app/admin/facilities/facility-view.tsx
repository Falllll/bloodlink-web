'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/api/hooks';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FacilityRow } from './facility-row';
import {
  FACILITY_TYPES,
  buildFacilityPath,
  type FacilityFilters,
  type FacilityPage,
  type FacilityType,
} from '@/lib/api/facilities';

const EMPTY_FILTERS: FacilityFilters = {
  type: '',
  city: '',
  province: '',
  isActive: '',
};

const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const HEAD = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]';
const SELECT =
  'h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export function FacilityView({ canManage }: { canManage: boolean }) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const id = useId();

  const [filters, setFilters] = useState<FacilityFilters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | null>(null);
  // Saringan KLIEN atas halaman yang sedang tampil saja: backend tidak punya
  // filter verifikasi dan tidak mengirim total, jadi ini bukan daftar lengkap.
  const [unverifiedOnly, setUnverifiedOnly] = useState(false);

  const path = buildFacilityPath(filters, cursor);
  const { data, isPending, isError, error } = useApiQuery<FacilityPage>(
    ['facilities', filters, cursor],
    path,
  );

  // Cursor buram milik kombinasi filter lama; memakainya pada filter baru
  // dibalas 200 dengan halaman kosong. Setiap perubahan filter WAJIB reset.
  function updateFilter<K extends keyof FacilityFilters>(key: K, value: FacilityFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCursor(null);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setCursor(null);
  }

  const prevCursor = data?.meta.prev_cursor ?? null;
  const nextCursor = data?.meta.has_more ? (data.meta.next_cursor ?? null) : null;
  const rows = data ? (unverifiedOnly ? data.data.filter((r) => !r.is_verified) : data.data) : [];

  return (
    <GlassPanel className="mt-6 p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-type`} className={LABEL}>
            {t('facilities.filters.type')}
          </label>
          <select
            id={`${id}-type`}
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value as FacilityType | '')}
            className={SELECT}
          >
            <option value="">{t('facilities.filters.allTypes')}</option>
            {FACILITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`facilities.type.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-city`} className={LABEL}>
            {t('facilities.filters.city')}
          </label>
          <Input
            id={`${id}-city`}
            value={filters.city}
            onChange={(e) => updateFilter('city', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-province`} className={LABEL}>
            {t('facilities.filters.province')}
          </label>
          <Input
            id={`${id}-province`}
            value={filters.province}
            onChange={(e) => updateFilter('province', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-active`} className={LABEL}>
            {t('facilities.filters.isActive')}
          </label>
          <select
            id={`${id}-active`}
            value={filters.isActive}
            onChange={(e) => updateFilter('isActive', e.target.value as 'true' | 'false' | '')}
            className={SELECT}
          >
            <option value="">{t('facilities.filters.allStatuses')}</option>
            <option value="true">{t('facilities.filters.active')}</option>
            <option value="false">{t('facilities.filters.inactive')}</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-1">
          <label htmlFor={`${id}-unverified`} className="flex items-center gap-2 text-sm text-[color:var(--color-ink)]">
            <input
              id={`${id}-unverified`}
              type="checkbox"
              checked={unverifiedOnly}
              aria-describedby={`${id}-unverified-hint`}
              onChange={(e) => setUnverifiedOnly(e.target.checked)}
            />
            {t('facilities.filters.unverifiedOnPage')}
          </label>
          <p id={`${id}-unverified-hint`} className="text-xs text-[color:var(--color-ink-muted)]">
            {t('facilities.filters.unverifiedHint')}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
          {t('facilities.filters.reset')}
        </Button>
      </div>

      <div className="mt-6">
        {isPending ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('facilities.loading')}
          </p>
        ) : isError ? (
          <p role="alert" className="py-8 text-center text-sm text-[color:var(--color-ink-soft)]">
            {translateApiError(error.body, t).summary}
          </p>
        ) : data.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('facilities.empty')}
          </p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('facilities.emptyOnPage')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={HEAD}>{t('facilities.column.name')}</th>
                  <th className={HEAD}>{t('facilities.column.type')}</th>
                  <th className={HEAD}>{t('facilities.column.location')}</th>
                  <th className={HEAD}>{t('facilities.column.active')}</th>
                  <th className={HEAD}>{t('facilities.column.verified')}</th>
                  <th className={HEAD}>
                    <span className="sr-only">{t('facilities.column.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((facility) => (
                  <FacilityRow key={facility.id} facility={facility} canVerify={canManage} />
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
          {t('facilities.prev')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={nextCursor === null}
          onClick={() => setCursor(nextCursor)}
        >
          {t('facilities.next')}
        </Button>
      </div>
    </GlassPanel>
  );
}
