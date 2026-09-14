export type BatchStatus =
  | 'QUARANTINED' | 'TESTING' | 'RELEASED' | 'RESERVED' | 'DISCARDED' | 'EXPIRED';

const TONE: Record<BatchStatus, { bg: string; fg: string }> = {
  QUARANTINED: { bg: 'rgba(159, 178, 255, 0.18)', fg: 'var(--color-status-quarantined)' },
  TESTING: { bg: 'rgba(242, 190, 114, 0.18)', fg: 'var(--color-status-testing)' },
  RELEASED: { bg: 'rgba(110, 224, 172, 0.18)', fg: 'var(--color-status-released)' },
  RESERVED: { bg: 'rgba(194, 169, 255, 0.18)', fg: 'var(--color-status-reserved)' },
  DISCARDED: { bg: 'rgba(226, 154, 154, 0.18)', fg: 'var(--color-status-discarded)' },
  EXPIRED: { bg: 'rgba(226, 154, 154, 0.18)', fg: 'var(--color-status-discarded)' },
};

export function StatusChip({ status }: { status: BatchStatus }) {
  const tone = TONE[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      {status}
    </span>
  );
}
