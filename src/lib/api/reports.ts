import type { useFormatter } from 'next-intl';
import type { BatchStatusValue } from '@/lib/api/blood-batches';

export type ReportGranularity = 'day' | 'week' | 'month';

export type ReportMeta = {
  granularity: ReportGranularity;
  from: string;           // awal bucket pertama SESUDAH perataan server
  to_exclusive: string;   // awal bucket SETELAH bucket terakhir -- eksklusif
  timezone: 'UTC';
};

// ratio = FRAKSI DESIMAL 4 angka (0.25 = 25%), bukan persen.
// null = TIDAK TERDEFINISI (denominator 0), bukan nol.
export type RatioFields = {
  numerator: number;
  denominator: number;
  ratio: number | null;
};

export type WastageBucket = RatioFields & {
  period_start: string;
  discarded: number;
  expired: number;
  released: number;
};

export type CrossmatchBucket = RatioFields & { period_start: string };

// Nilai enum yang sama dengan status blood-batch; satu sumber, bukan salinan.
export type BatchStatus = BatchStatusValue;

export type StockTrendBucket = {
  period_start: string;
  // Kedelapan kunci SELALU ada; bucket kosong bernilai 0.
  transitions_to: Record<BatchStatus, number>;
};

export type WastageResponse = { data: WastageBucket[]; meta: ReportMeta & { numerator: string; denominator: string } };
export type StockTrendResponse = { data: StockTrendBucket[]; meta: ReportMeta };
export type CrossmatchResponse = { data: CrossmatchBucket[]; meta: ReportMeta & { numerator: string; denominator: string } };

export type ReportRange = { from: string; to: string; granularity: ReportGranularity };

export const GRANULARITIES: readonly ReportGranularity[] = ['day', 'week', 'month'];
export const BATCH_STATUSES: readonly BatchStatus[] = [
  'quarantined', 'testing', 'released', 'reserved', 'issued', 'discarded', 'expired', 'separated',
];

// Ketiganya WAJIB; tidak ada default di server. Query key lain -> 422 not_allowed,
// jadi JANGAN menambahkan facility_id, cursor, per_page, atau sort.
export function buildReportPath(
  report: 'wastage' | 'stock-trend' | 'crossmatch-transfusion',
  range: ReportRange,
): string {
  const params = new URLSearchParams();

  params.set('from', range.from);
  params.set('to', range.to);
  params.set('granularity', range.granularity);

  return `/reports/${report}?${params.toString()}`;
}

function toYmd(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

export function defaultRange(today: Date): ReportRange {
  // Komponen tanggal lokal, bukan toISOString(): yang terakhir menggeser
  // tanggal mundur sehari untuk zona waktu di timur UTC.
  const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);

  return { from: toYmd(from), to: toYmd(today), granularity: 'month' };
}

export function formatRatio(ratio: number | null, format: ReturnType<typeof useFormatter>, dash: string): string {
  if (ratio === null) return dash;

  // style 'unit' + 'percent' tidak mengalikan sendiri (beda dengan style
  // 'percent'), jadi perkalian 100 di bawah ini satu-satunya.
  return format.number(ratio * 100, { style: 'unit', unit: 'percent', maximumFractionDigits: 2 });
}
