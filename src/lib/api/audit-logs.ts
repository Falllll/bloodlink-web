import type { ApiPaginated } from '@/lib/api/types';

export type AuditAction = 'created' | 'updated' | 'deleted';

export type AuditLogEntry = {
  id: string;
  auditable_type: string;
  auditable_id: number;
  action: AuditAction;
  actor_id: number | null;
  actor_facility_id: number | null;
  changes: { before: Record<string, unknown>; after: Record<string, unknown> };
  trace_id: string | null;
  ip: string | null;
  occurred_at: string;
};

export type AuditLogPage = ApiPaginated<AuditLogEntry>;

export type AuditLogFilters = {
  action?: AuditAction | '';
  auditableType?: string;
  actorId?: string;
  traceId?: string;
  occurredFrom?: string;
  occurredTo?: string;
};

export const AUDIT_ACTIONS: readonly AuditAction[] = ['created', 'updated', 'deleted'];
export const AUDIT_PER_PAGE = 25;

export function buildAuditLogPath(
  filters: AuditLogFilters,
  cursor: string | null,
): string {
  const params = new URLSearchParams();

  const entries: ReadonlyArray<[string, string | undefined]> = [
    ['filter[action]', filters.action],
    ['filter[auditable_type]', filters.auditableType],
    ['filter[actor_id]', filters.actorId],
    ['filter[trace_id]', filters.traceId],
    ['occurred_from', filters.occurredFrom],
    ['occurred_to', filters.occurredTo],
  ];

  for (const [name, value] of entries) {
    const trimmed = value?.trim();
    if (trimmed) params.set(name, trimmed);
  }

  params.set('per_page', String(AUDIT_PER_PAGE));
  params.set('sort', '-occurred_at');
  if (cursor !== null) params.set('cursor', cursor);

  return `/audit-logs?${params.toString()}`;
}
