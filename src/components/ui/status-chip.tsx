import type { BatchStatusValue } from '@/lib/api/blood-batches';

export type BatchStatus =
  | 'QUARANTINED' | 'TESTING' | 'RELEASED' | 'RESERVED' | 'ISSUED' | 'DISCARDED' | 'EXPIRED'
  | 'SEPARATED';

const TONE: Record<BatchStatus, { fg: string }> = {
  QUARANTINED: { fg: 'var(--color-status-quarantined)' },
  TESTING: { fg: 'var(--color-status-testing)' },
  RELEASED: { fg: 'var(--color-status-released)' },
  RESERVED: { fg: 'var(--color-status-reserved)' },
  ISSUED: { fg: 'var(--color-status-issued)' },
  DISCARDED: { fg: 'var(--color-status-discarded)' },
  EXPIRED: { fg: 'var(--color-status-discarded)' },
  SEPARATED: { fg: 'var(--color-status-separated)' },
};

// API mengirim status lowercase; chip memakai enum UPPERCASE. Satu-satunya titik konversi.
export function toChipStatus(status: BatchStatusValue): BatchStatus {
  return status.toUpperCase() as BatchStatus;
}

// Pintu keluar generik untuk domain selain blood-batch: warna dari tone, teks
// dari label terlokalisasi. Enum batch di atas tidak dimasuki domain lain.
export type ChipTone = 'positive' | 'warning' | 'neutral' | 'danger';

const GENERIC_TONE: Record<ChipTone, { fg: string }> = {
  positive: { fg: 'var(--color-status-released)' },
  warning: { fg: 'var(--color-status-testing)' },
  neutral: { fg: 'var(--color-ink-muted)' },
  danger: { fg: 'var(--color-destructive)' },
};

type StatusChipProps =
  | { status: BatchStatus; tone?: undefined; label?: undefined }
  | { status?: undefined; tone: ChipTone; label: string };

export function StatusChip({ status, tone: chipTone, label }: StatusChipProps) {
  const tone = chipTone === undefined ? TONE[status] : GENERIC_TONE[chipTone];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide"
      style={{
        backgroundColor: `color-mix(in oklch, ${tone.fg} 18%, transparent)`,
        color: tone.fg,
      }}
    >
      {chipTone === undefined ? status : label}
    </span>
  );
}
