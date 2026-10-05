'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Input } from '@/components/ui/input';
import { ApiFailure } from '@/lib/api/client';
import { useApiMutation } from '@/lib/api/hooks';
import type { ApiSuccess } from '@/lib/api/types';
import {
  postSelfCheck,
  type EligibilitySelfCheck,
  type SelfCheckPayload,
} from '@/lib/api/eligibility';
import { translateApiError, type TranslatedApiError } from '@/lib/errors/translate-api-error';
import { SelfCheckResult } from './self-check-result';

type StepId = 'basics' | 'lastDonation' | 'awareness';

type Answers = {
  dateOfBirth: string;              // 'yyyy-mm-dd'
  sex: '' | 'male' | 'female';
  weightKg: string;                 // string mentah dari <Input type="number">
  neverDonated: boolean;
  lastDonationDate: string;         // 'yyyy-mm-dd'
  plannedVolumeMl: '' | '350' | '450';
};

const STEP_ORDER: readonly StepId[] = ['basics', 'lastDonation', 'awareness'];

const EMPTY_ANSWERS: Answers = {
  dateOfBirth: '',
  sex: '',
  weightKg: '',
  neverDonated: false,
  lastDonationDate: '',
  plannedVolumeMl: '',
};

const AWARENESS_ITEMS = ['i1', 'i2', 'i3'] as const;

const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const LEGEND = 'font-display text-lg font-semibold text-[color:var(--color-ink-strong)]';
const CHOICE = 'flex items-center gap-2 text-sm text-[color:var(--color-ink-soft)]';

export function SelfCheckForm() {
  const t = useTranslations('selfCheck');
  const tRoot = useTranslations(); // translateApiError butuh kunci errors.*/validation.*/fields.*
  const [step, setStep] = useState<StepId>('basics');
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);

  const m = useApiMutation<ApiSuccess<EligibilitySelfCheck>, SelfCheckPayload>(
    (payload) => postSelfCheck(payload),
    { redirectOnUnauthenticated: false },
  );

  // Kegagalan di luar ApiFailure (mis. /bff sendiri tak terjangkau) tetap jadi
  // pesan gagal — jangan pernah jatuh ke kartu hasil.
  const err: TranslatedApiError | null =
    m.error === null
      ? null
      : m.error instanceof ApiFailure
        ? translateApiError(m.error.body, tRoot)
        : { summary: t('result.failed'), fields: {} };

  const stepIndex = STEP_ORDER.indexOf(step);
  const isLastStep = stepIndex === STEP_ORDER.length - 1;
  const todayIso = new Date().toISOString().slice(0, 10);

  // Tombol "lanjut" juga bertipe submit supaya atribut `required` milik langkah
  // yang sedang tampil ikut ditegakkan browser. Mutation hanya dari langkah terakhir.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isLastStep) {
      setStep(STEP_ORDER[stepIndex + 1]);
      return;
    }

    m.mutate(buildPayload(answers));
  }

  function goBack() {
    if (stepIndex > 0) setStep(STEP_ORDER[stepIndex - 1]);
  }

  function restart() {
    setAnswers(EMPTY_ANSWERS);
    setStep('basics');
    m.reset();
  }

  if (m.data) {
    return <SelfCheckResult result={m.data.data} onRestart={restart} />;
  }

  return (
    <GlassPanel className="p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-muted)]">
          {t('stepOf', { current: stepIndex + 1, total: STEP_ORDER.length })}
        </p>

        {step === 'basics' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="dob" className={LABEL}>
                {t('basics.dateOfBirth')}
              </label>
              <Input
                id="dob"
                type="date"
                required
                max={todayIso}
                value={answers.dateOfBirth}
                onChange={(e) => setAnswers((a) => ({ ...a, dateOfBirth: e.target.value }))}
              />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className={LABEL}>{t('basics.sex')}</legend>
              <div className="flex flex-wrap gap-4">
                {(['male', 'female'] as const).map((sex) => (
                  <label key={sex} className={CHOICE}>
                    <input
                      type="radio"
                      name="sex"
                      value={sex}
                      required
                      checked={answers.sex === sex}
                      onChange={() => setAnswers((a) => ({ ...a, sex }))}
                    />
                    {sex === 'male' ? t('basics.sexMale') : t('basics.sexFemale')}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-1">
              <label htmlFor="weight" className={LABEL}>
                {t('basics.weightKg')}
              </label>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                min={20}
                max={300}
                step="0.1"
                aria-describedby="weight-hint"
                value={answers.weightKg}
                onChange={(e) => setAnswers((a) => ({ ...a, weightKg: e.target.value }))}
              />
              <p id="weight-hint" className="text-xs text-[color:var(--color-ink-muted)]">
                {t('basics.weightHint')}
              </p>
            </div>
          </div>
        )}

        {step === 'lastDonation' && (
          <fieldset className="flex flex-col gap-4">
            <legend className={LEGEND}>{t('lastDonation.legend')}</legend>
            <label className={CHOICE}>
              <input
                type="checkbox"
                checked={answers.neverDonated}
                onChange={(e) => setAnswers((a) => ({ ...a, neverDonated: e.target.checked }))}
              />
              {t('lastDonation.never')}
            </label>
            {!answers.neverDonated && (
              <div className="flex flex-col gap-1">
                <label htmlFor="last-donation" className={LABEL}>
                  {t('lastDonation.date')}
                </label>
                <Input
                  id="last-donation"
                  type="date"
                  max={todayIso}
                  value={answers.lastDonationDate}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, lastDonationDate: e.target.value }))
                  }
                />
              </div>
            )}
            <fieldset className="flex flex-col gap-2">
              <legend className={LABEL}>{t('lastDonation.volume')}</legend>
              <div className="flex flex-wrap gap-4">
                {(['', '350', '450'] as const).map((volume) => (
                  <label key={volume || 'any'} className={CHOICE}>
                    <input
                      type="radio"
                      name="planned-volume"
                      value={volume}
                      checked={answers.plannedVolumeMl === volume}
                      onChange={() => setAnswers((a) => ({ ...a, plannedVolumeMl: volume }))}
                    />
                    {volume === ''
                      ? t('lastDonation.volumeAny')
                      : t(`lastDonation.volume${volume}`)}
                  </label>
                ))}
              </div>
            </fieldset>
          </fieldset>
        )}

        {step === 'awareness' && (
          <fieldset className="flex flex-col gap-3">
            <legend className={LEGEND}>{t('awareness.legend')}</legend>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--color-ink-soft)]">
              {AWARENESS_ITEMS.map((item) => (
                <li key={item}>{t(`awareness.${item}`)}</li>
              ))}
            </ul>
            <p className="text-sm text-[color:var(--color-ink-muted)]">{t('awareness.note')}</p>
          </fieldset>
        )}

        {err !== null && (
          <div role="alert" className="flex flex-col gap-1 text-sm text-[color:var(--color-ink-strong)]">
            <p>{err.summary}</p>
            {Object.entries(err.fields).map(([field, messages]) =>
              messages.map((message) => (
                <p key={`${field}-${message}`} className="text-[color:var(--color-ink-soft)]">
                  {message}
                </p>
              )),
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-3">
          <Button
            type="button"
            size="lg"
            variant="ghost"
            onClick={goBack}
            disabled={stepIndex === 0 || m.isPending}
          >
            {t('nav.back')}
          </Button>
          {isLastStep ? (
            <Button key="submit" type="submit" size="lg" disabled={m.isPending}>
              {m.isPending ? t('nav.submitting') : t('nav.submit')}
            </Button>
          ) : (
            <Button key="next" type="submit" size="lg" variant="outline">
              {t('nav.next')}
            </Button>
          )}
        </div>
      </form>
    </GlassPanel>
  );
}

function buildPayload(answers: Answers): SelfCheckPayload {
  // `required` di input sudah menjamin sex terisi sebelum langkah pertama dilewati.
  const payload: SelfCheckPayload = {
    date_of_birth: answers.dateOfBirth,
    sex: answers.sex as SelfCheckPayload['sex'],
  };

  if (answers.weightKg !== '') payload.weight_kg = Number(answers.weightKg);
  if (!answers.neverDonated && answers.lastDonationDate !== '') {
    payload.last_donation_date = answers.lastDonationDate;
  }
  if (answers.plannedVolumeMl !== '') {
    payload.planned_volume_ml = Number(answers.plannedVolumeMl) as 350 | 450;
  }

  return payload;
}
