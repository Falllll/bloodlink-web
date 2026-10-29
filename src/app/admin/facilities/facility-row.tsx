'use client';

import { useId, useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusChip } from '@/components/ui/status-chip';
import { ApiFailure, apiFetch } from '@/lib/api/client';
import { useApiMutation } from '@/lib/api/hooks';
import type { ApiSuccess } from '@/lib/api/types';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { verifyFacilityInit, type FacilityRow as Facility } from '@/lib/api/facilities';

const CELL = 'px-3 py-2 align-top';
const SUB = 'text-xs text-[color:var(--color-ink-muted)]';
const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';

type Attempt = { note: string; request: [string, RequestInit] };

export function FacilityRow({ facility, canVerify }: { facility: Facility; canVerify: boolean }) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const format = useFormatter();
  const queryClient = useQueryClient();
  const panelId = useId();
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const inFlight = useRef(false);
  // Satu aksi pengguna = satu Idempotency-Key. Percobaan ulang dengan catatan
  // yang sama memakai [path, init] yang sama; catatan berubah = aksi baru.
  const attempt = useRef<Attempt | null>(null);

  const m = useApiMutation<ApiSuccess<Facility>, [string, RequestInit]>(
    ([path, init]) => apiFetch<ApiSuccess<Facility>>(path, init),
    {
      onSuccess: () => {
        attempt.current = null;
        setOpen(false);
        void queryClient.invalidateQueries({ queryKey: ['facilities'] });
      },
    },
  );

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;

    if (attempt.current === null || attempt.current.note !== note) {
      attempt.current = { note, request: verifyFacilityInit(facility.id, note) };
    }

    m.mutate(attempt.current.request, { onSettled: () => { inFlight.current = false; } });
  }

  let errorText: string | null = null;
  if (m.error instanceof ApiFailure) {
    // Verifikasi ganda dibalas abort(409) dengan kode GENERIK HTTP_ERROR, jadi
    // kodenya saja tidak cukup: syaratnya status 409 + kode, tidak pernah message.
    errorText =
      m.error.status === 409 && m.error.body.error.code === 'HTTP_ERROR'
        ? t('facilities.alreadyVerified')
        : translateApiError(m.error.body, t).summary;
  }

  const showVerify = canVerify && !facility.is_verified;

  return (
    <>
      <tr className="border-b border-border text-[color:var(--color-ink)]">
        <td className={CELL}>
          <div>{facility.name}</div>
          <div className={`${SUB} font-mono`}>{facility.code}</div>
        </td>
        <td className={CELL}>{t(`facilities.type.${facility.type}`)}</td>
        <td className={CELL}>
          {t('facilities.location', { city: facility.city, province: facility.province })}
        </td>
        <td className={CELL}>
          <StatusChip
            tone={facility.is_active ? 'positive' : 'neutral'}
            label={facility.is_active ? t('facilities.status.active') : t('facilities.status.inactive')}
          />
        </td>
        <td className={CELL}>
          <StatusChip
            tone={facility.is_verified ? 'positive' : 'warning'}
            label={facility.is_verified ? t('facilities.status.verified') : t('facilities.status.unverified')}
          />
          {facility.verified_at !== null ? (
            <div className={`${SUB} mt-1`}>
              {t('facilities.verifiedAt', {
                date: format.dateTime(new Date(facility.verified_at), { dateStyle: 'medium' }),
              })}
            </div>
          ) : null}
        </td>
        <td className={`${CELL} text-right`}>
          {/* Tanpa kemampuan: tidak ada tombol sama sekali, bukan tombol disabled. */}
          {showVerify ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? t('facilities.cancel') : t('facilities.verify')}
            </Button>
          ) : null}
        </td>
      </tr>
      {showVerify && open ? (
        <tr id={panelId} className="border-b border-border">
          <td colSpan={6} className="px-3 pb-3">
            <form onSubmit={handleVerify} noValidate className="flex flex-col gap-2 rounded-lg bg-[color:var(--muted)] p-3">
              <p className={SUB}>{t('facilities.verifyHint')}</p>
              <label htmlFor={noteId} className={LABEL}>
                {t('facilities.verifyNote')}
              </label>
              <Input
                id={noteId}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              {errorText !== null ? (
                <p role="alert" className="text-sm text-destructive">
                  {errorText}
                </p>
              ) : null}
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={m.isPending}>
                  {m.isPending ? t('facilities.verifying') : t('facilities.verifyConfirm')}
                </Button>
              </div>
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}
