export type BatchStatus =
  | 'QUARANTINED' | 'TESTING' | 'RELEASED' | 'RESERVED' | 'DISCARDED' | 'EXPIRED';

const TONE: Record<BatchStatus, { fg: string }> = {
  QUARANTINED: { fg: 'var(--color-status-quarantined)' },
  TESTING: { fg: 'var(--color-status-testing)' },
  RELEASED: { fg: 'var(--color-status-released)' },
  RESERVED: { fg: 'var(--color-status-reserved)' },
  DISCARDED: { fg: 'var(--color-status-discarded)' },
  EXPIRED: { fg: 'var(--color-status-discarded)' },
};

export function StatusChip({ status }: { status: BatchStatus }) {
  const tone = TONE[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide"
      style={{
        backgroundColor: `color-mix(in oklch, ${tone.fg} 18%, transparent)`,
        color: tone.fg,
      }}
    >
      {status}
    </span>
  );
}
