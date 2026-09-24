import type { AuditAction } from '@/lib/api/audit-logs';

// Merah dicadangkan untuk aksi utama, status mendesak, dan hitung mundur
// kedaluwarsa (Kartu 505) — `deleted` sengaja amber, bukan merah.
const TONE: Record<AuditAction, string> = {
  created:
    'bg-[color:color-mix(in_oklch,var(--color-status-released)_18%,transparent)] text-[color:var(--color-status-released)]',
  updated:
    'bg-[color:color-mix(in_oklch,var(--color-status-quarantined)_18%,transparent)] text-[color:var(--color-status-quarantined)]',
  deleted:
    'bg-[color:color-mix(in_oklch,var(--color-status-testing)_18%,transparent)] text-[color:var(--color-status-testing)]',
};

export function ActionBadge({ action, label }: { action: AuditAction; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide ${TONE[action]}`}
    >
      {label}
    </span>
  );
}
