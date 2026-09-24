'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/api/hooks';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuditLogRow } from './audit-log-row';
import {
  AUDIT_ACTIONS,
  buildAuditLogPath,
  type AuditAction,
  type AuditLogFilters,
  type AuditLogPage,
} from '@/lib/api/audit-logs';

const EMPTY_FILTERS: AuditLogFilters = {
  action: '',
  auditableType: '',
  actorId: '',
  traceId: '',
  occurredFrom: '',
  occurredTo: '',
};

const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const HEAD = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]';

export function AuditLogView() {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const id = useId();

  const [filters, setFilters] = useState<AuditLogFilters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<string | null>(null);

  const path = buildAuditLogPath(filters, cursor);
  const { data, isPending, isError, error } = useApiQuery<AuditLogPage>(
    ['audit-logs', filters, cursor],
    path,
  );

  // Cursor buram milik kombinasi filter lama; memakainya pada filter baru
  // dibalas 200 dengan halaman kosong. Setiap perubahan filter WAJIB reset.
  function updateFilter<K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-action`} className={LABEL}>
            {t('audit.filters.action')}
          </label>
          <select
            id={`${id}-action`}
            value={filters.action}
            onChange={(e) => updateFilter('action', e.target.value as AuditAction | '')}
            className="h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">{t('audit.filters.allActions')}</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {t(`audit.action.${action}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-type`} className={LABEL}>
            {t('audit.filters.auditableType')}
          </label>
          <Input
            id={`${id}-type`}
            value={filters.auditableType}
            onChange={(e) => updateFilter('auditableType', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-actor`} className={LABEL}>
            {t('audit.filters.actorId')}
          </label>
          <Input
            id={`${id}-actor`}
            inputMode="numeric"
            value={filters.actorId}
            onChange={(e) => updateFilter('actorId', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-trace`} className={LABEL}>
            {t('audit.filters.traceId')}
          </label>
          <Input
            id={`${id}-trace`}
            value={filters.traceId}
            onChange={(e) => updateFilter('traceId', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-from`} className={LABEL}>
            {t('audit.filters.from')}
          </label>
          <Input
            id={`${id}-from`}
            type="date"
            value={filters.occurredFrom}
            onChange={(e) => updateFilter('occurredFrom', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-to`} className={LABEL}>
            {t('audit.filters.to')}
          </label>
          <Input
            id={`${id}-to`}
            type="date"
            value={filters.occurredTo}
            onChange={(e) => updateFilter('occurredTo', e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
          {t('audit.filters.reset')}
        </Button>
      </div>

      <div className="mt-6">
        {isPending ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('audit.loading')}
          </p>
        ) : isError ? (
          <p role="alert" className="py-8 text-center text-sm text-[color:var(--color-ink-soft)]">
            {translateApiError(error.body, t).summary}
          </p>
        ) : data.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-[color:var(--color-ink-muted)]">
            {t('audit.empty')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={HEAD}>{t('audit.column.occurredAt')}</th>
                  <th className={HEAD}>{t('audit.column.action')}</th>
                  <th className={HEAD}>{t('audit.column.subject')}</th>
                  <th className={HEAD}>{t('audit.column.actor')}</th>
                  <th className={HEAD}>{t('audit.column.trace')}</th>
                  <th className={HEAD}>
                    <span className="sr-only">{t('audit.column.changes')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((entry) => (
                  <AuditLogRow key={entry.id} entry={entry} />
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
          {t('audit.prev')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={nextCursor === null}
          onClick={() => setCursor(nextCursor)}
        >
          {t('audit.next')}
        </Button>
      </div>
    </GlassPanel>
  );
}
