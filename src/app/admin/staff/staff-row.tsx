'use client';

import { useId, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { ApiFailure, apiFetch } from '@/lib/api/client';
import { useApiMutation } from '@/lib/api/hooks';
import type { ApiSuccess } from '@/lib/api/types';
import { translateApiError } from '@/lib/errors/translate-api-error';
import {
  STAFF_ROLES,
  assignStaffInit,
  isAssignableRole,
  setStaffActiveInit,
  type StaffAccount,
  type StaffRole,
} from '@/lib/api/staff';

const CELL = 'px-3 py-2 align-top';
const SUB = 'text-xs text-[color:var(--color-ink-muted)]';
const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const SELECT =
  'h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

type Attempt = { action: string; request: [string, RequestInit] };

export function StaffRow({
  staff,
  isSelf,
  facilityName,
}: {
  staff: StaffAccount;
  isSelf: boolean;
  facilityName: string | null;
}) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const format = useFormatter();
  const queryClient = useQueryClient();
  const panelId = useId();
  const roleId = useId();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<StaffRole | ''>(isAssignableRole(staff.role) ? staff.role : '');
  const inFlight = useRef(false);
  // Satu aksi pengguna = satu Idempotency-Key. Percobaan ulang atas aksi yang
  // sama memakai [path, init] yang sama; kunci baru pada retry = perubahan ganda.
  const attempt = useRef<Attempt | null>(null);

  const m = useApiMutation<ApiSuccess<StaffAccount>, [string, RequestInit]>(
    ([path, init]) => apiFetch<ApiSuccess<StaffAccount>>(path, init),
    {
      onSuccess: () => {
        attempt.current = null;
        setOpen(false);
        void queryClient.invalidateQueries({ queryKey: ['staff'] });
      },
    },
  );

  function run(action: string, build: () => [string, RequestInit]) {
    if (inFlight.current) return;
    inFlight.current = true;

    if (attempt.current === null || attempt.current.action !== action) {
      attempt.current = { action, request: build() };
    }

    m.mutate(attempt.current.request, { onSettled: () => { inFlight.current = false; } });
  }

  function handleAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // facility_id SEKARANG ikut terkirim: PUT /assignment bukan patch parsial.
    // role kosong sengaja diteruskan supaya 422-nya yang berbicara.
    run(`assign:${role}`, () =>
      assignStaffInit(staff.id, { facility_id: staff.facility_id, role: role as StaffRole }),
    );
  }

  function handleToggleActive() {
    const next = !staff.is_active;
    run(`active:${next}`, () => setStaffActiveInit(staff.id, next));
  }

  // Akun sendiri dan akun yang bukan staf: tidak ada tombol sama sekali, bukan tombol disabled.
  const canAct = !isSelf && isAssignableRole(staff.role);

  const err = m.error instanceof ApiFailure ? translateApiError(m.error.body, t) : null;
  const errorMessages = err === null ? [] : [err.summary, ...Object.values(err.fields).flat()];

  return (
    <>
      <tr className="border-b border-border text-[color:var(--color-ink)]">
        <td className={CELL}>
          <div>{staff.name}</div>
          <div className={SUB}>{staff.email}</div>
        </td>
        <td className={CELL}>{facilityName ?? <span className={`${SUB} font-mono`}>{staff.facility_id}</span>}</td>
        <td className={CELL}>{isAssignableRole(staff.role) ? t(`staff.role.${staff.role}`) : t('staff.role.unknown')}</td>
        <td className={CELL}>
          <StatusChip
            tone={staff.is_active ? 'positive' : 'neutral'}
            label={staff.is_active ? t('staff.status.active') : t('staff.status.inactive')}
          />
        </td>
        <td className={CELL}>
          {staff.created_at === null
            ? t('staff.none')
            : format.dateTime(new Date(staff.created_at), { dateStyle: 'medium' })}
        </td>
        <td className={`${CELL} text-right`}>
          {canAct ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((value) => !value)}
              >
                {open ? t('staff.edit.close') : t('staff.edit.open')}
              </Button>
              <Button type="button" variant="outline" size="xs" disabled={m.isPending} onClick={handleToggleActive}>
                {staff.is_active ? t('staff.deactivate') : t('staff.activate')}
              </Button>
            </div>
          ) : null}
        </td>
      </tr>
      {canAct && open ? (
        <tr id={panelId} className="border-b border-border">
          <td colSpan={6} className="px-3 pb-3">
            <form onSubmit={handleAssign} noValidate className="flex flex-col gap-2 rounded-lg bg-[color:var(--muted)] p-3">
              <label htmlFor={roleId} className={LABEL}>
                {t('fields.role')}
              </label>
              <select
                id={roleId}
                required
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole | '')}
                className={SELECT}
              >
                <option value="">{t('staff.choose')}</option>
                {STAFF_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {t(`staff.role.${value}`)}
                  </option>
                ))}
              </select>
              {/* Wajib terbaca SEBELUM menyimpan, bukan sesudah. */}
              <p className={SUB}>{t('staff.edit.warning')}</p>
              {errorMessages.map((message) => (
                <p key={message} role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              ))}
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={m.isPending}>
                  {m.isPending ? t('staff.edit.submitting') : t('staff.edit.submit')}
                </Button>
              </div>
            </form>
          </td>
        </tr>
      ) : null}
      {canAct && !open && errorMessages.length > 0 ? (
        <tr className="border-b border-border">
          <td colSpan={6} className="px-3 pb-3">
            {errorMessages.map((message) => (
              <p key={message} role="alert" className="text-sm text-destructive">
                {message}
              </p>
            ))}
          </td>
        </tr>
      ) : null}
    </>
  );
}
