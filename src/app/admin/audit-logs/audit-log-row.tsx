'use client';

import { useId, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ActionBadge } from '@/components/ui/action-badge';
import { Button } from '@/components/ui/button';
import type { AuditLogEntry } from '@/lib/api/audit-logs';

const CELL = 'px-3 py-2 align-top';
const SUB = 'text-xs text-[color:var(--color-ink-muted)]';

export function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const t = useTranslations('audit');
  const format = useFormatter();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="border-b border-border text-[color:var(--color-ink)]">
        <td className={`${CELL} whitespace-nowrap`}>
          {format.dateTime(new Date(entry.occurred_at), { dateStyle: 'medium', timeStyle: 'short' })}
        </td>
        <td className={CELL}>
          <ActionBadge action={entry.action} label={t(`action.${entry.action}`)} />
        </td>
        <td className={CELL}>
          <div className="break-all">{entry.auditable_type}</div>
          <div className={SUB}>{t('subjectId', { id: entry.auditable_id })}</div>
        </td>
        <td className={CELL}>
          <div>
            {entry.actor_id === null
              ? t('unknownActor')
              : t('actorValue', { id: entry.actor_id })}
          </div>
          <div className={SUB}>
            {entry.actor_facility_id === null
              ? t('noFacility')
              : t('facilityValue', { id: entry.actor_facility_id })}
          </div>
        </td>
        <td className={CELL}>
          <div className="break-all font-mono text-xs">{entry.trace_id ?? t('none')}</div>
          <div className={SUB}>{t('ipValue', { ip: entry.ip ?? t('none') })}</div>
        </td>
        <td className={`${CELL} text-right`}>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? t('hideChanges') : t('showChanges')}
          </Button>
        </td>
      </tr>
      {open ? (
        <tr id={panelId} className="border-b border-border">
          <td colSpan={6} className="px-3 pb-3">
            <pre className="max-h-96 overflow-auto rounded-lg bg-[color:var(--muted)] p-3 font-mono text-xs text-[color:var(--color-ink-soft)]">
              {JSON.stringify(entry.changes, null, 2)}
            </pre>
          </td>
        </tr>
      ) : null}
    </>
  );
}
