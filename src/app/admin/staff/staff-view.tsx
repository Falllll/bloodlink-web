'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useApiCursorPages, useApiQuery } from '@/lib/api/hooks';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import {
  FACILITY_MAP_MAX_PAGES,
  FACILITY_MAP_PER_PAGE,
  buildFacilityPath,
  type FacilityRow,
} from '@/lib/api/facilities';
import { buildStaffPath, type StaffFilters, type StaffPage } from '@/lib/api/staff';
import { InviteStaffForm } from './invite-staff-form';
import { StaffRow } from './staff-row';

const EMPTY_FILTERS: StaffFilters = { isActive: '' };

const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const HEAD = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]';

export function StaffView({ selfId }: { selfId: string | null }) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const id = useId();

  const [filters, setFilters] = useState<StaffFilters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const { data, isPending, isError, error } = useApiQuery<StaffPage>(
    ['staff', filters, cursor],
    buildStaffPath(filters, cursor),
  );

  const facilities = useApiCursorPages<FacilityRow>(
    ['facilities', 'active-options'],
    (next) => buildFacilityPath({ isActive: 'true' }, next, FACILITY_MAP_PER_PAGE),
    FACILITY_MAP_MAX_PAGES,
  );
  const facilityOptions = facilities.data?.items ?? [];

  // Cursor buram milik kombinasi filter lama; memakainya pada filter baru
  // dibalas 200 dengan halaman kosong. Setiap perubahan filter WAJIB reset.
  function updateIsActive(isActive: StaffFilters['isActive']) {
    setFilters({ isActive });
    setCursor(null);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setCursor(null);
  }

  const prevCursor = data?.meta.prev_cursor ?? null;
  const nextCursor = data?.meta.has_more ? (data.meta.next_cursor ?? null) : null;

  return (
    <GlassPanel className="mt-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-active`} className={LABEL}>
            {t('staff.filters.status')}
          </label>
          <select
            id={`${id}-active`}
            value={filters.isActive}
            onChange={(e) => updateIsActive(e.target.value as StaffFilters['isActive'])}
            className="h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{t('staff.filters.all')}</option>
            <option value="true">{t('staff.status.active')}</option>
            <option value="false">{t('staff.status.inactive')}</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            {t('staff.filters.reset')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={inviting}
            onClick={() => setInviting((value) => !value)}
          >
            {inviting ? t('staff.invite.close') : t('staff.invite.open')}
          </Button>
        </div>
      </div>

      {inviting ? (
        <InviteStaffForm
          facilities={facilityOptions}
          facilitiesError={facilities.isError ? translateApiError(facilities.error.body, t).summary : null}
        />
      ) : null}

      <div className="mt-6">
        {isPending ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('staff.loading')}
          </p>
        ) : isError ? (
          <p role="alert" className="py-8 text-center text-sm text-[color:var(--color-ink-soft)]">
            {translateApiError(error.body, t).summary}
          </p>
        ) : data.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('staff.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={HEAD}>{t('staff.column.name')}</th>
                  <th className={HEAD}>{t('staff.column.facility')}</th>
                  <th className={HEAD}>{t('staff.column.role')}</th>
                  <th className={HEAD}>{t('staff.column.status')}</th>
                  <th className={HEAD}>{t('staff.column.createdAt')}</th>
                  <th className={HEAD}>
                    <span className="sr-only">{t('staff.column.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((staff) => (
                  <StaffRow
                    key={staff.id}
                    staff={staff}
                    isSelf={staff.id === selfId}
                    facilityName={facilityOptions.find((facility) => facility.id === staff.facility_id)?.name ?? null}
                  />
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
          {t('staff.prev')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={nextCursor === null}
          onClick={() => setCursor(nextCursor)}
        >
          {t('staff.next')}
        </Button>
      </div>
    </GlassPanel>
  );
}
