'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/api/hooks';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DonorRow } from './donor-row';
import {
  DEFERRAL_STATUSES,
  DONOR_BLOOD_GROUPS,
  DONOR_RH_FACTORS,
  DONOR_SEXES,
  buildDonorPath,
  type DeferralStatus,
  type DonorBloodGroup,
  type DonorFilters,
  type DonorPage,
  type DonorRhFactor,
  type DonorSex,
} from '@/lib/api/donors';

const EMPTY_FILTERS: DonorFilters = {
  search: '',
  bloodGroup: '',
  rhFactor: '',
  sex: '',
  city: '',
  deferralStatus: '',
};

const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const HEAD = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]';
const SELECT =
  'h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export function DonorView({ canManage }: { canManage: boolean }) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const id = useId();

  const [filters, setFilters] = useState<DonorFilters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | null>(null);
  // `search` memakai kemiripan pg_trgm, bukan awalan: ketikan sebagian tidak
  // selalu cocok, jadi pencarian dikirim saat diserahkan, bukan per ketukan.
  const [searchDraft, setSearchDraft] = useState('');

  const path = buildDonorPath(filters, cursor);
  const { data, isPending, isError, error } = useApiQuery<DonorPage>(
    ['donors', filters, cursor],
    path,
  );

  // Cursor buram milik kombinasi filter lama; memakainya pada filter baru
  // dibalas 200 dengan halaman kosong. Setiap perubahan filter WAJIB reset.
  function updateFilter<K extends keyof DonorFilters>(key: K, value: DonorFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCursor(null);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setSearchDraft('');
    setCursor(null);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateFilter('search', searchDraft);
  }

  const prevCursor = data?.meta.prev_cursor ?? null;
  const nextCursor = data?.meta.has_more ? (data.meta.next_cursor ?? null) : null;

  return (
    <GlassPanel className="mt-6 p-6">
      <form onSubmit={handleSearch} className="flex flex-col gap-1">
        <label htmlFor={`${id}-search`} className={LABEL}>
          {t('donors.filters.search')}
        </label>
        <div className="flex gap-2">
          <Input
            id={`${id}-search`}
            maxLength={255}
            value={searchDraft}
            aria-describedby={`${id}-search-hint`}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
          <Button type="submit" variant="outline">
            {t('donors.filters.searchSubmit')}
          </Button>
        </div>
        <p id={`${id}-search-hint`} className="text-xs text-[color:var(--color-ink-muted)]">
          {t('donors.filters.searchHint')}
        </p>
      </form>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-group`} className={LABEL}>
            {t('donors.filters.bloodGroup')}
          </label>
          <select
            id={`${id}-group`}
            value={filters.bloodGroup}
            onChange={(e) => updateFilter('bloodGroup', e.target.value as DonorBloodGroup | '')}
            className={SELECT}
          >
            <option value="">{t('donors.filters.all')}</option>
            {DONOR_BLOOD_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-rh`} className={LABEL}>
            {t('donors.filters.rhFactor')}
          </label>
          <select
            id={`${id}-rh`}
            value={filters.rhFactor}
            onChange={(e) => updateFilter('rhFactor', e.target.value as DonorRhFactor | '')}
            className={SELECT}
          >
            <option value="">{t('donors.filters.all')}</option>
            {DONOR_RH_FACTORS.map((rh) => (
              <option key={rh} value={rh}>
                {t(`donors.rhFactor.${rh}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-sex`} className={LABEL}>
            {t('donors.filters.sex')}
          </label>
          <select
            id={`${id}-sex`}
            value={filters.sex}
            onChange={(e) => updateFilter('sex', e.target.value as DonorSex | '')}
            className={SELECT}
          >
            <option value="">{t('donors.filters.all')}</option>
            {DONOR_SEXES.map((sex) => (
              <option key={sex} value={sex}>
                {t(`donors.sex.${sex}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-city`} className={LABEL}>
            {t('donors.filters.city')}
          </label>
          <Input
            id={`${id}-city`}
            value={filters.city}
            onChange={(e) => updateFilter('city', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-deferral`} className={LABEL}>
            {t('donors.filters.deferralStatus')}
          </label>
          <select
            id={`${id}-deferral`}
            value={filters.deferralStatus}
            onChange={(e) => updateFilter('deferralStatus', e.target.value as DeferralStatus | '')}
            className={SELECT}
          >
            <option value="">{t('donors.filters.all')}</option>
            {DEFERRAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`donors.deferralStatus.${status}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
          {t('donors.filters.reset')}
        </Button>
      </div>

      <div className="mt-6">
        {isPending ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('donors.loading')}
          </p>
        ) : isError ? (
          <p role="alert" className="py-8 text-center text-sm text-[color:var(--color-ink-soft)]">
            {translateApiError(error.body, t).summary}
          </p>
        ) : data.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('donors.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={HEAD}>{t('donors.column.donor')}</th>
                  <th className={HEAD}>{t('donors.column.bloodType')}</th>
                  <th className={HEAD}>{t('donors.column.sex')}</th>
                  <th className={HEAD}>{t('donors.column.city')}</th>
                  <th className={HEAD}>{t('donors.column.lastDonation')}</th>
                  <th className={HEAD}>{t('donors.column.donationCount')}</th>
                  <th className={HEAD}>{t('donors.column.deferralStatus')}</th>
                  <th className={HEAD}>
                    <span className="sr-only">{t('donors.column.details')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((donor) => (
                  <DonorRow key={donor.id} donor={donor} canManage={canManage} />
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
          {t('donors.prev')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={nextCursor === null}
          onClick={() => setCursor(nextCursor)}
        >
          {t('donors.next')}
        </Button>
      </div>
    </GlassPanel>
  );
}
