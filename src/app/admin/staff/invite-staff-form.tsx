'use client';

import { useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiFailure, apiFetch } from '@/lib/api/client';
import type { FacilityRow } from '@/lib/api/facilities';
import { useApiMutation } from '@/lib/api/hooks';
import type { ApiSuccess } from '@/lib/api/types';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { STAFF_ROLES, inviteStaffInit, type StaffAccount, type StaffRole } from '@/lib/api/staff';

const LABEL = 'text-sm text-[color:var(--color-ink-soft)]';
const SELECT =
  'h-8 w-full rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

const FORM_FIELDS = ['name', 'email', 'facility_id', 'role'];

type Attempt = { snapshot: string; request: [string, RequestInit] };

function FieldErrors({ messages }: { messages: string[] | undefined }) {
  return messages?.map((message) => (
    <p key={message} className="text-sm text-destructive">
      {message}
    </p>
  ));
}

export function InviteStaffForm({
  facilities,
  facilitiesError,
}: {
  facilities: FacilityRow[];
  facilitiesError: string | null;
}) {
  const t = useTranslations();
  const id = useId();
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  // Satu aksi pengguna = satu Idempotency-Key. Percobaan ulang dengan isian yang
  // sama memakai [path, init] yang sama; kunci baru pada retry = akun ganda.
  const attempt = useRef<Attempt | null>(null);

  // Nama state = nama field API, supaya err.fields.<nama> mendarat di input yang benar.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [facility_id, setFacilityId] = useState('');
  const [role, setRole] = useState<StaffRole | ''>('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  const m = useApiMutation<ApiSuccess<StaffAccount>, [string, RequestInit]>(
    ([path, init]) => apiFetch<ApiSuccess<StaffAccount>>(path, init),
    {
      onSuccess: (result) => {
        attempt.current = null;
        setSentTo(result.data.email);
        setName('');
        setEmail('');
        setFacilityId('');
        setRole('');
        void queryClient.invalidateQueries({ queryKey: ['staff'] });
      },
    },
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setSentTo(null);

    // Validasi otoritatif di backend; nilai kosong sengaja diteruskan apa adanya
    // supaya 422-nya yang berbicara, bukan tebakan klien.
    const input = { name, email, facility_id, role: role as StaffRole };
    const snapshot = JSON.stringify(input);

    if (attempt.current === null || attempt.current.snapshot !== snapshot) {
      attempt.current = { snapshot, request: inviteStaffInit(input) };
    }

    m.mutate(attempt.current.request, { onSettled: () => { inFlight.current = false; } });
  }

  const err = m.error instanceof ApiFailure ? translateApiError(m.error.body, t) : null;
  // Key di luar keempat input tetap terlihat, misalnya not_allowed dari StrictRequest.
  const otherErrors =
    err === null
      ? []
      : Object.entries(err.fields)
          .filter(([field]) => !FORM_FIELDS.includes(field))
          .flatMap(([, messages]) => messages);

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4 rounded-lg bg-[color:var(--muted)] p-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-name`} className={LABEL}>
          {t('fields.name')}
        </label>
        <Input id={`${id}-name`} required maxLength={255} value={name} onChange={(e) => setName(e.target.value)} />
        <FieldErrors messages={err?.fields.name} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${id}-email`} className={LABEL}>
          {t('fields.email')}
        </label>
        <Input
          id={`${id}-email`}
          type="email"
          required
          maxLength={255}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FieldErrors messages={err?.fields.email} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${id}-facility`} className={LABEL}>
          {t('fields.facility_id')}
        </label>
        <select
          id={`${id}-facility`}
          required
          value={facility_id}
          onChange={(e) => setFacilityId(e.target.value)}
          className={SELECT}
        >
          <option value="">{t('staff.choose')}</option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </select>
        {facilitiesError !== null ? <p className="text-sm text-destructive">{facilitiesError}</p> : null}
        <FieldErrors messages={err?.fields.facility_id} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${id}-role`} className={LABEL}>
          {t('fields.role')}
        </label>
        <select
          id={`${id}-role`}
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
        <FieldErrors messages={err?.fields.role} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <p className="text-xs text-[color:var(--color-ink-muted)]">{t('staff.invite.hint')}</p>
        <FieldErrors messages={otherErrors} />
        {err !== null ? (
          <p role="alert" className="text-sm text-destructive">
            {err.summary}
          </p>
        ) : null}
        {sentTo !== null ? (
          <p role="status" className="text-sm text-[color:var(--color-ink-soft)]">
            {t('staff.invite.sent', { email: sentTo })}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={m.isPending}>
            {m.isPending ? t('staff.invite.submitting') : t('staff.invite.submit')}
          </Button>
        </div>
      </div>
    </form>
  );
}
