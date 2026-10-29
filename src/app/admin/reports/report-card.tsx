'use client';

import { useId, useState, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ApiFailure } from '@/lib/api/client';
import type { ReportMeta } from '@/lib/api/reports';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';

const MUTED = 'text-sm text-[color:var(--color-ink-muted)]';
const HEAD = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]';
const CELL = 'px-3 py-2 align-top';

export function ReportCard<T extends { data: unknown[]; meta: ReportMeta }>({
  title,
  note,
  query,
  children,
}: {
  title: string;
  note?: ReactNode;
  query: UseQueryResult<T, ApiFailure>;
  children: (response: T) => ReactNode;
}) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const format = useFormatter();
  const { data, isPending, isError, error } = query;

  // Rentang dari meta (sesudah perataan server), BUKAN dari input pengguna.
  const day = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: 'medium', timeZone: 'UTC' });

  return (
    <GlassPanel className="p-6">
      <h2 className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]">
        {title}
      </h2>
      {note ? <p className={`mt-1 ${MUTED}`}>{note}</p> : null}
      {data ? (
        <p className="mt-1 text-xs text-[color:var(--color-ink-muted)]">
          {t('reports.windowLabel', {
            from: day(data.meta.from),
            toExclusive: day(data.meta.to_exclusive),
          })}
        </p>
      ) : null}

      <div className="mt-4">
        {isPending ? (
          <p className={`py-8 text-center ${MUTED}`}>{t('reports.loading')}</p>
        ) : isError ? (
          <ErrorMessage error={error} />
        ) : data.data.length === 0 ? (
          <p className={`py-8 text-center ${MUTED}`}>{t('reports.empty')}</p>
        ) : (
          children(data)
        )}
      </div>
    </GlassPanel>
  );
}

function ErrorMessage({ error }: { error: ApiFailure }) {
  const t = useTranslations();
  const { summary, fields } = translateApiError(error.body, t);
  const details = Object.values(fields).flat();

  return (
    <div role="alert" className="py-8 text-center text-sm text-[color:var(--color-ink-soft)]">
      <p>{summary}</p>
      {details.map((message) => (
        <p key={message} className="mt-1">
          {message}
        </p>
      ))}
    </div>
  );
}

export function CompanionTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<{ key: string; cells: string[] }>;
}) {
  const t = useTranslations('reports');
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="ghost"
        size="xs"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? t('hideTable') : t('showTable')}
      </Button>
      {open ? (
        <div id={panelId} className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {headers.map((header) => (
                  <th key={header} className={HEAD}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-border text-[color:var(--color-ink)]">
                  {row.cells.map((cell, i) => (
                    <td key={i} className={`${CELL} ${i === 0 ? 'whitespace-nowrap' : 'tabular-nums'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
