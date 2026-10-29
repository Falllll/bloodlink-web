'use client';

import { useId, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useApiQuery } from '@/lib/api/hooks';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Input } from '@/components/ui/input';
import { CompanionTable, ReportCard } from './report-card';
import { TrendChart } from './trend-chart';
import {
  BATCH_STATUSES,
  GRANULARITIES,
  buildReportPath,
  defaultRange,
  formatRatio,
  type BatchStatus,
  type CrossmatchResponse,
  type ReportGranularity,
  type ReportRange,
  type StockTrendResponse,
  type WastageResponse,
} from '@/lib/api/reports';

const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const FIGURE = 'font-display text-3xl font-semibold tabular-nums text-[color:var(--color-ink-strong)]';
const DEFINITION = 'mt-1 text-xs text-[color:var(--color-ink-muted)]';

// Warna kategoris, bukan penilaian: tidak ada merah, tidak ada amber.
const COLOR = {
  released: 'var(--color-status-released)',
  issued: 'var(--color-status-issued)',
  discarded: 'var(--color-status-reserved)',
  expired: 'var(--color-ink-muted)',
  ratio: 'var(--color-status-quarantined)',
} as const;

// Empat dari delapan; kedelapannya tetap ada di tabel.
const CHARTED_STATUSES = ['released', 'issued', 'discarded', 'expired'] as const satisfies readonly BatchStatus[];

export function ReportsView() {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const format = useFormatter();
  const id = useId();
  const [range, setRange] = useState<ReportRange>(() => defaultRange(new Date()));

  const wastage = useApiQuery<WastageResponse>(['reports', 'wastage', range], buildReportPath('wastage', range));
  const stock = useApiQuery<StockTrendResponse>(['reports', 'stock-trend', range], buildReportPath('stock-trend', range));
  const cross = useApiQuery<CrossmatchResponse>(['reports', 'crossmatch-transfusion', range], buildReportPath('crossmatch-transfusion', range));

  function updateRange<K extends keyof ReportRange>(key: K, value: ReportRange[K]) {
    setRange((prev) => ({ ...prev, [key]: value }));
  }

  const none = t('reports.none');
  const ratio = (value: number | null) => formatRatio(value, format, none);
  const count = (value: number | null) => (value === null ? none : format.number(value));
  // period_start adalah tanggal UTC; tampilkan di UTC supaya tidak bergeser sehari.
  const period = (value: string, granularity: ReportGranularity) =>
    granularity === 'month'
      ? format.dateTime(new Date(value), { year: 'numeric', month: 'short', timeZone: 'UTC' })
      : format.dateTime(new Date(value), { dateStyle: 'medium', timeZone: 'UTC' });

  return (
    <div className="mt-6 flex flex-col gap-6">
      <GlassPanel className="p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-from`} className={LABEL}>
              {t('reports.filters.from')}
            </label>
            <Input
              id={`${id}-from`}
              type="date"
              required
              value={range.from}
              onChange={(e) => updateRange('from', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-to`} className={LABEL}>
              {t('reports.filters.to')}
            </label>
            <Input
              id={`${id}-to`}
              type="date"
              required
              value={range.to}
              onChange={(e) => updateRange('to', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-granularity`} className={LABEL}>
              {t('reports.filters.granularity')}
            </label>
            <select
              id={`${id}-granularity`}
              value={range.granularity}
              onChange={(e) => updateRange('granularity', e.target.value as ReportGranularity)}
              className="h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {GRANULARITIES.map((g) => (
                <option key={g} value={g}>
                  {t(`reports.granularity.${g}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassPanel>

      <ReportCard title={t('reports.wastage.title')} query={wastage}>
        {({ data, meta }) => {
          const latest = data[data.length - 1];
          const labels = data.map((b) => period(b.period_start, meta.granularity));

          return (
            <>
              <p className={LABEL}>{t('reports.latest', { period: period(latest.period_start, meta.granularity) })}</p>
              <p className={FIGURE}>{ratio(latest.ratio)}</p>
              <p className={DEFINITION}>
                {t('reports.definition', { numerator: meta.numerator, denominator: meta.denominator })}
              </p>
              <div className="mt-4">
                <TrendChart
                  title={t('reports.wastage.chartLabel')}
                  labels={labels}
                  formatValue={count}
                  series={[
                    { key: 'discarded', label: t('reports.status.discarded'), kind: 'bar', color: COLOR.discarded, values: data.map((b) => b.discarded) },
                    { key: 'expired', label: t('reports.status.expired'), kind: 'bar', color: COLOR.expired, dashed: true, values: data.map((b) => b.expired) },
                    { key: 'released', label: t('reports.status.released'), kind: 'line', color: COLOR.released, values: data.map((b) => b.released) },
                  ]}
                />
              </div>
              <CompanionTable
                headers={[
                  t('reports.column.period'),
                  t('reports.status.discarded'),
                  t('reports.status.expired'),
                  t('reports.status.released'),
                  t('reports.column.ratio'),
                ]}
                rows={data.map((b, i) => ({
                  key: b.period_start,
                  cells: [labels[i], count(b.discarded), count(b.expired), count(b.released), ratio(b.ratio)],
                }))}
              />
            </>
          );
        }}
      </ReportCard>

      <ReportCard title={t('reports.crossmatch.title')} query={cross}>
        {({ data, meta }) => {
          const latest = data[data.length - 1];
          const labels = data.map((b) => period(b.period_start, meta.granularity));

          return (
            <>
              <p className={LABEL}>{t('reports.latest', { period: period(latest.period_start, meta.granularity) })}</p>
              <p className={FIGURE}>{ratio(latest.ratio)}</p>
              <p className={DEFINITION}>
                {t('reports.definition', { numerator: meta.numerator, denominator: meta.denominator })}
              </p>
              <div className="mt-4">
                <TrendChart
                  title={t('reports.crossmatch.chartLabel')}
                  labels={labels}
                  formatValue={ratio}
                  series={[
                    { key: 'ratio', label: t('reports.column.ratio'), kind: 'line', color: COLOR.ratio, values: data.map((b) => b.ratio) },
                  ]}
                />
              </div>
              <CompanionTable
                headers={[t('reports.column.period'), meta.numerator, meta.denominator, t('reports.column.ratio')]}
                rows={data.map((b, i) => ({
                  key: b.period_start,
                  cells: [labels[i], count(b.numerator), count(b.denominator), ratio(b.ratio)],
                }))}
              />
            </>
          );
        }}
      </ReportCard>

      <ReportCard title={t('reports.stockTrend.title')} note={t('reports.stockTrend.note')} query={stock}>
        {({ data, meta }) => {
          const labels = data.map((b) => period(b.period_start, meta.granularity));

          return (
            <>
              <TrendChart
                title={t('reports.stockTrend.chartLabel')}
                labels={labels}
                formatValue={count}
                series={CHARTED_STATUSES.map((status) => ({
                  key: status,
                  label: t(`reports.status.${status}`),
                  kind: 'line' as const,
                  color: COLOR[status],
                  dashed: status === 'expired',
                  values: data.map((b) => b.transitions_to[status]),
                }))}
              />
              <CompanionTable
                headers={[t('reports.column.period'), ...BATCH_STATUSES.map((s) => t(`reports.status.${s}`))]}
                rows={data.map((b, i) => ({
                  key: b.period_start,
                  cells: [labels[i], ...BATCH_STATUSES.map((s) => count(b.transitions_to[s]))],
                }))}
              />
            </>
          );
        }}
      </ReportCard>
    </div>
  );
}
