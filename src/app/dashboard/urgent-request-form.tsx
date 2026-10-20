'use client';

import { useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiFailure, apiFetch, newIdempotencyKey } from '@/lib/api/client';
import { useApiMutation } from '@/lib/api/hooks';
import { translateApiError } from '@/lib/errors/translate-api-error';
import {
  BLOOD_GROUPS,
  COMPONENTS,
  RH_FACTORS,
  type BloodGroup,
  type ComponentValue,
  type RhFactor,
} from '@/lib/api/blood-batches';
import {
  URGENCIES,
  URGENT_REQUEST_PATH,
  type Urgency,
  type UrgentRequestPayload,
  type UrgentRequestResult,
} from '@/lib/api/blood-requests';
import { NearbyStockResult } from './nearby-stock-result';

const LABEL = 'text-sm text-[color:var(--color-ink-soft)]';
const SELECT =
  'h-8 w-full rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

type Submission = { payload: UrgentRequestPayload; idempotencyKey: string };

function FieldErrors({ messages }: { messages: string[] | undefined }) {
  return messages?.map((message) => (
    <p key={message} className="text-sm text-destructive">
      {message}
    </p>
  ));
}

export function UrgentRequestForm() {
  const t = useTranslations();
  const id = useId();
  const queryClient = useQueryClient();
  const inFlight = useRef(false);

  // Nama state = nama field API, supaya err.fields.<nama> mendarat di input yang benar.
  const [patient_reference, setPatientReference] = useState('');
  const [component, setComponent] = useState<ComponentValue | ''>('');
  const [blood_group, setBloodGroup] = useState<BloodGroup | ''>('');
  const [rh_factor, setRhFactor] = useState<RhFactor | ''>('');
  const [quantity, setQuantity] = useState('');
  const [urgency, setUrgency] = useState<Urgency | ''>('');
  const [needed_by, setNeededBy] = useState('');
  const [note, setNote] = useState('');

  const m = useApiMutation<UrgentRequestResult, Submission>(
    ({ payload, idempotencyKey }) =>
      apiFetch<UrgentRequestResult>(URGENT_REQUEST_PATH, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      }),
    { onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['blood-batches'] }) },
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Penjaga klik ganda: kunci sinkron di ref, bukan m.isPending. TanStack
    // menjadwalkan notifikasi status lewat setTimeout, jadi klik kedua yang
    // datang sebelum render ulang masih melihat isPending=false dan tombol
    // belum nonaktif (terbukti dua POST di tab Network). Dipilih ketimbang
    // memegang kunci di state karena kunci yang sama tetap mengirim POST kedua,
    // yang dibalas REQUEST_IN_PROGRESS dan menimpa hasil sukses di layar.
    if (inFlight.current) return;
    inFlight.current = true;

    // Validasi otoritatif di backend; nilai kosong sengaja diteruskan apa adanya
    // supaya 422-nya yang berbicara, bukan tebakan klien.
    const payload = {
      patient_reference,
      component,
      blood_group,
      rh_factor,
      quantity: quantity === '' ? '' : Number(quantity),
      urgency,
      needed_by: needed_by === '' ? '' : new Date(needed_by).toISOString(),
      note: note.trim() === '' ? null : note,
    } as UrgentRequestPayload;

    // Satu kunci per aksi pengguna, dibuat di sini, bukan di dalam mutationFn.
    m.mutate(
      { payload, idempotencyKey: newIdempotencyKey() },
      { onSettled: () => { inFlight.current = false; } },
    );
  }

  const err = m.error instanceof ApiFailure ? translateApiError(m.error.body, t) : null;

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]">
        {t('dashboard.urgent.heading')}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('dashboard.urgent.description')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={`${id}-patient`} className={LABEL}>
            {t('fields.patient_reference')}
          </label>
          <Input
            id={`${id}-patient`}
            required
            maxLength={64}
            value={patient_reference}
            onChange={(e) => setPatientReference(e.target.value)}
          />
          <FieldErrors messages={err?.fields.patient_reference} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-component`} className={LABEL}>
            {t('fields.component')}
          </label>
          <select
            id={`${id}-component`}
            required
            value={component}
            onChange={(e) => setComponent(e.target.value as ComponentValue | '')}
            className={SELECT}
          >
            <option value="">{t('dashboard.urgent.choose')}</option>
            {COMPONENTS.map((value) => (
              <option key={value} value={value}>
                {t(`dashboard.component.${value}`)}
              </option>
            ))}
          </select>
          <FieldErrors messages={err?.fields.component} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-urgency`} className={LABEL}>
            {t('fields.urgency')}
          </label>
          {/* routine sengaja tidak ditawarkan: endpoint ini menolaknya 422. */}
          <select
            id={`${id}-urgency`}
            required
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as Urgency | '')}
            className={SELECT}
          >
            <option value="">{t('dashboard.urgent.choose')}</option>
            {URGENCIES.map((value) => (
              <option key={value} value={value}>
                {t(`dashboard.urgency.${value}`)}
              </option>
            ))}
          </select>
          <FieldErrors messages={err?.fields.urgency} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-group`} className={LABEL}>
            {t('fields.blood_group')}
          </label>
          <select
            id={`${id}-group`}
            required
            value={blood_group}
            onChange={(e) => setBloodGroup(e.target.value as BloodGroup | '')}
            className={SELECT}
          >
            <option value="">{t('dashboard.urgent.choose')}</option>
            {BLOOD_GROUPS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <FieldErrors messages={err?.fields.blood_group} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-rh`} className={LABEL}>
            {t('fields.rh_factor')}
          </label>
          <select
            id={`${id}-rh`}
            required
            value={rh_factor}
            onChange={(e) => setRhFactor(e.target.value as RhFactor | '')}
            className={SELECT}
          >
            <option value="">{t('dashboard.urgent.choose')}</option>
            {RH_FACTORS.map((value) => (
              <option key={value} value={value}>
                {t(`dashboard.rh.${value}`)}
              </option>
            ))}
          </select>
          <FieldErrors messages={err?.fields.rh_factor} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-quantity`} className={LABEL}>
            {t('fields.quantity')}
          </label>
          <Input
            id={`${id}-quantity`}
            type="number"
            inputMode="numeric"
            required
            min={1}
            max={20}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <FieldErrors messages={err?.fields.quantity} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-needed`} className={LABEL}>
            {t('fields.needed_by')}
          </label>
          <Input
            id={`${id}-needed`}
            type="datetime-local"
            required
            value={needed_by}
            onChange={(e) => setNeededBy(e.target.value)}
          />
          <FieldErrors messages={err?.fields.needed_by} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor={`${id}-note`} className={LABEL}>
            {t('fields.note')}
          </label>
          <textarea
            id={`${id}-note`}
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 py-2 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <FieldErrors messages={err?.fields.note} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Button type="submit" className="w-full" disabled={m.isPending}>
            {m.isPending ? t('dashboard.urgent.submitting') : t('dashboard.urgent.submit')}
          </Button>
          {err && (
            <p role="alert" className="text-sm text-destructive">
              {err.summary}
            </p>
          )}
        </div>
      </form>

      {m.data && (
        <div className="mt-6 border-t border-border pt-6">
          <NearbyStockResult status={m.data.data.nearby_stock_status} entries={m.data.data.nearby_stock} />
        </div>
      )}
    </div>
  );
}
