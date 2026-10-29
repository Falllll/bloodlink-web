'use client';

import { useId, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusChip } from '@/components/ui/status-chip';
import { ApiFailure, apiFetch } from '@/lib/api/client';
import { useApiMutation, useApiQuery } from '@/lib/api/hooks';
import type { ApiSuccess } from '@/lib/api/types';
import { translateApiError } from '@/lib/errors/translate-api-error';
import {
  DONOR_FLAG_LIFT_REASON_MAX,
  DONOR_FLAG_NOTE_MAX,
  DONOR_FLAG_REASONS,
  buildDonorFlagsPath,
  liftDonorFlagInit,
  placeDonorFlagInit,
  type DonorFlagPage,
  type DonorFlagReason,
  type DonorFlagRow,
  type DonorRow as Donor,
} from '@/lib/api/donors';

const CELL = 'px-3 py-2 align-top';
const SUB = 'text-xs text-[color:var(--color-ink-muted)]';
const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const SELECT =
  'h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';
const TEXTAREA =
  'min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

type Translator = ReturnType<typeof useTranslations>;
type Request = [string, RequestInit];

function FieldErrors({ messages }: { messages: string[] | undefined }) {
  return messages?.map((message) => (
    <p key={message} className="text-sm text-destructive">
      {message}
    </p>
  ));
}

// DONOR_FLAG_REJECTED punya tepat dua sebab di backend (alreadyFlagged untuk
// tempat, alreadyLifted untuk cabut), jadi kalimatnya dipilih per aksi dari
// kode -- tidak pernah dari message.
function mutationError(error: unknown, t: Translator, rejectedKey: string) {
  if (!(error instanceof ApiFailure)) return null;
  const translated = translateApiError(error.body, t);
  return {
    summary: error.body.error.code === 'DONOR_FLAG_REJECTED' ? t(rejectedKey) : translated.summary,
    fields: translated.fields,
  };
}

// Tanggal lokal besok dalam format <input type="date">: ends_at wajib setelah sekarang.
function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function PlaceFlagForm({ donorId, onDone }: { donorId: string; onDone: () => void }) {
  const t = useTranslations();
  const id = useId();
  const inFlight = useRef(false);
  // Satu aksi pengguna = satu Idempotency-Key; payload berubah = aksi baru.
  const attempt = useRef<{ payload: string; request: Request } | null>(null);

  // Nama state = nama field API, supaya err.fields.<nama> mendarat di input yang benar.
  const [reason, setReason] = useState<DonorFlagReason | ''>('');
  const [note, setNote] = useState('');
  const [ends_at, setEndsAt] = useState('');

  const m = useApiMutation<ApiSuccess<DonorFlagRow>, Request>(
    ([path, init]) => apiFetch<ApiSuccess<DonorFlagRow>>(path, init),
    {
      onSuccess: () => {
        attempt.current = null;
        onDone();
      },
    },
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;

    // Validasi otoritatif di backend; nilai kosong diteruskan supaya 422 yang berbicara.
    const body = {
      reason: reason as DonorFlagReason,
      note,
      ends_at: ends_at === '' ? null : new Date(`${ends_at}T00:00:00`).toISOString(),
    };
    const payload = JSON.stringify(body);
    if (attempt.current === null || attempt.current.payload !== payload) {
      attempt.current = { payload, request: placeDonorFlagInit(donorId, body) };
    }

    m.mutate(attempt.current.request, { onSettled: () => { inFlight.current = false; } });
  }

  const err = mutationError(m.error, t, 'donors.place.rejected');

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 grid gap-3 sm:grid-cols-2">
      <h4 className="font-display text-sm font-semibold text-[color:var(--color-ink-strong)] sm:col-span-2">
        {t('donors.place.heading')}
      </h4>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-reason`} className={LABEL}>
          {t('donors.place.reason')}
        </label>
        <select
          id={`${id}-reason`}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value as DonorFlagReason | '')}
          className={SELECT}
        >
          <option value="" disabled>
            {t('donors.none')}
          </option>
          {DONOR_FLAG_REASONS.map((value) => (
            <option key={value} value={value}>
              {t(`donors.flagReason.${value}`)}
            </option>
          ))}
        </select>
        <FieldErrors messages={err?.fields.reason} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-ends`} className={LABEL}>
          {t('donors.place.endsAt')}
        </label>
        <Input
          id={`${id}-ends`}
          type="date"
          min={tomorrow()}
          value={ends_at}
          aria-describedby={`${id}-ends-hint`}
          onChange={(e) => setEndsAt(e.target.value)}
        />
        <p id={`${id}-ends-hint`} className={SUB}>
          {t('donors.place.endsAtHint')}
        </p>
        <FieldErrors messages={err?.fields.ends_at} />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`${id}-note`} className={LABEL}>
          {t('donors.place.note')}
        </label>
        <textarea
          id={`${id}-note`}
          required
          maxLength={DONOR_FLAG_NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={TEXTAREA}
        />
        <FieldErrors messages={err?.fields.note} />
      </div>
      {err !== null ? (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {err.summary}
        </p>
      ) : null}
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" size="sm" disabled={m.isPending}>
          {m.isPending ? t('donors.place.submitting') : t('donors.place.submit')}
        </Button>
      </div>
    </form>
  );
}

function LiftFlagForm({ flagId, onDone }: { flagId: string; onDone: () => void }) {
  const t = useTranslations();
  const id = useId();
  const panelId = useId();
  const inFlight = useRef(false);
  const attempt = useRef<{ reason: string; request: Request } | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const m = useApiMutation<ApiSuccess<DonorFlagRow>, Request>(
    ([path, init]) => apiFetch<ApiSuccess<DonorFlagRow>>(path, init),
    {
      onSuccess: () => {
        attempt.current = null;
        setOpen(false);
        onDone();
      },
    },
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;

    if (attempt.current === null || attempt.current.reason !== reason) {
      attempt.current = { reason, request: liftDonorFlagInit(flagId, reason) };
    }

    m.mutate(attempt.current.request, { onSettled: () => { inFlight.current = false; } });
  }

  const err = mutationError(m.error, t, 'donors.lift.rejected');

  return (
    <div className="mt-2">
      <Button
        type="button"
        variant="outline"
        size="xs"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? t('donors.lift.cancel') : t('donors.lift.open')}
      </Button>
      {open ? (
        <form id={panelId} onSubmit={handleSubmit} noValidate className="mt-2 flex flex-col gap-1">
          <label htmlFor={`${id}-reason`} className={LABEL}>
            {t('donors.lift.reason')}
          </label>
          <textarea
            id={`${id}-reason`}
            required
            maxLength={DONOR_FLAG_LIFT_REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={TEXTAREA}
          />
          <FieldErrors messages={err?.fields.reason} />
          {err !== null ? (
            <p role="alert" className="text-sm text-destructive">
              {err.summary}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={m.isPending}>
              {m.isPending ? t('donors.lift.submitting') : t('donors.lift.submit')}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function FlagPanel({ donorId, canManage }: { donorId: string; canManage: boolean }) {
  const t = useTranslations();
  const format = useFormatter();
  const queryClient = useQueryClient();

  // Riwayat (semua flag) dan flag aktif diambil terpisah: "aktif" memakai
  // definisi backend (filter[active]), bukan tebakan dari ends_at di klien.
  const history = useApiQuery<DonorFlagPage>(
    ['donor-flags', donorId, 'all'],
    buildDonorFlagsPath(donorId, false),
  );
  const active = useApiQuery<DonorFlagPage>(
    ['donor-flags', donorId, 'active'],
    buildDonorFlagsPath(donorId, true),
    { enabled: canManage },
  );

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['donor-flags', donorId] });
  }

  const date = (value: string) => format.dateTime(new Date(value), { dateStyle: 'medium' });
  const activeFlag = active.data?.data[0] ?? null;

  return (
    <div className="rounded-lg bg-[color:var(--muted)] p-3">
      <h3 className="font-display text-sm font-semibold text-[color:var(--color-ink-strong)]">
        {t('donors.flags.heading')}
      </h3>
      {history.isPending ? (
        <p className={`${SUB} mt-2`}>{t('donors.flags.loading')}</p>
      ) : history.isError ? (
        <p role="alert" className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
          {translateApiError(history.error.body, t).summary}
        </p>
      ) : history.data.data.length === 0 ? (
        <p className={`${SUB} mt-2`}>{t('donors.flags.empty')}</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-border">
          {history.data.data.map((flag) => (
            <li key={flag.id} className="flex flex-col gap-1 py-2 text-sm text-[color:var(--color-ink)]">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip
                  tone={flag.is_active ? 'warning' : 'neutral'}
                  label={flag.is_active ? t('donors.flags.active') : t('donors.flags.inactive')}
                />
                <span className="font-medium">{t(`donors.flagReason.${flag.reason}`)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words">{flag.note}</p>
              <p className={SUB}>
                {t('donors.flags.startsAt', { date: date(flag.starts_at) })}
                {' · '}
                {flag.ends_at === null
                  ? t('donors.flags.noEnd')
                  : t('donors.flags.endsAt', { date: date(flag.ends_at) })}
                {flag.lifted_at !== null ? ` · ${t('donors.flags.liftedAt', { date: date(flag.lifted_at) })}` : null}
              </p>
              {flag.lift_note !== null ? (
                <p className={SUB}>{t('donors.flags.liftNote', { note: flag.lift_note })}</p>
              ) : null}
              {canManage && flag.id === activeFlag?.id ? (
                <LiftFlagForm flagId={flag.id} onDone={refresh} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {/* Tanpa kemampuan: form tidak dirender sama sekali, bukan disabled. */}
      {canManage && active.isSuccess && activeFlag === null ? (
        <PlaceFlagForm donorId={donorId} onDone={refresh} />
      ) : null}
      {canManage && active.isError ? (
        <p role="alert" className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
          {translateApiError(active.error.body, t).summary}
        </p>
      ) : null}
    </div>
  );
}

export function DonorRow({ donor, canManage }: { donor: Donor; canManage: boolean }) {
  const t = useTranslations();
  const format = useFormatter();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="border-b border-border text-[color:var(--color-ink)]">
        <td className={CELL}>
          <div>{donor.full_name}</div>
          <div className={`${SUB} font-mono`}>{donor.donor_number}</div>
        </td>
        <td className={CELL}>
          {donor.blood_group === null
            ? t('donors.none')
            : `${donor.blood_group} ${donor.rh_factor === null ? '' : t(`donors.rhFactor.${donor.rh_factor}`)}`.trim()}
        </td>
        <td className={CELL}>{t(`donors.sex.${donor.sex}`)}</td>
        <td className={CELL}>{donor.city}</td>
        <td className={`${CELL} whitespace-nowrap`}>
          {donor.last_donation_date === null
            ? t('donors.none')
            : format.dateTime(new Date(donor.last_donation_date), { dateStyle: 'medium' })}
        </td>
        <td className={CELL}>{format.number(donor.donation_count)}</td>
        <td className={CELL}>{t(`donors.deferralStatus.${donor.deferral_status}`)}</td>
        <td className={`${CELL} text-right`}>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? t('donors.hideDetails') : t('donors.showDetails')}
          </Button>
        </td>
      </tr>
      {open ? (
        <tr id={panelId} className="border-b border-border">
          <td colSpan={8} className="px-3 pb-3">
            {/* Panel baru dipasang saat dibuka, jadi query flag hanya jalan saat itu. */}
            <FlagPanel donorId={donor.id} canManage={canManage} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
