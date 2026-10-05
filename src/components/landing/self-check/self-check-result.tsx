'use client';

import { CheckIcon, CircleHelpIcon, XIcon, type LucideIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import type { EligibilityOutcome, EligibilitySelfCheck } from '@/lib/api/eligibility';
import { FINDING_MESSAGE_KEY, OUTCOME_TONE } from '@/lib/eligibility/finding-copy';

type OutcomeCopy = { title: string; body: string };

// Ikon ikut membedakan state supaya hasil tidak bergantung pada warna saja.
const OUTCOME_ICON: Record<EligibilityOutcome, LucideIcon> = {
  eligible: CheckIcon,
  not_eligible: XIcon,
  undetermined: CircleHelpIcon,
};

export function SelfCheckResult({
  result,
  onRestart,
}: {
  result: EligibilitySelfCheck;
  onRestart: () => void;
}) {
  const t = useTranslations('selfCheck.result');
  const tMedical = useTranslations('medical');
  const tNav = useTranslations('selfCheck.nav');
  const format = useFormatter();

  const copy: Record<EligibilityOutcome, OutcomeCopy> = {
    eligible: { title: t('eligibleTitle'), body: t('eligibleBody') },
    not_eligible: { title: t('notEligibleTitle'), body: t('notEligibleBody') },
    undetermined: { title: t('undeterminedTitle'), body: t('undeterminedBody') },
  };
  const { title, body } = copy[result.outcome];
  const Icon = OUTCOME_ICON[result.outcome];

  return (
    <GlassPanel className="flex flex-col gap-4 p-6" aria-live="polite">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
          style={outcomeBadgeStyle(result.outcome)}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
        <h3 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          {title}
        </h3>
      </div>
      <p className="text-sm text-[color:var(--color-ink-muted)]">{t('provisional')}</p>
      <p className="text-sm text-[color:var(--color-ink-soft)]">{body}</p>
      {result.retry_after_date !== null && (
        <p className="text-sm font-medium text-[color:var(--color-ink-strong)]">
          {t('retryAfter', {
            // 'yyyy-mm-dd' tanpa jam: dibaca & diformat di UTC agar harinya tidak bergeser.
            date: format.dateTime(new Date(`${result.retry_after_date}T00:00:00Z`), {
              dateStyle: 'long',
              timeZone: 'UTC',
            }),
          })}
        </p>
      )}
      {result.findings.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-[color:var(--color-ink-strong)]">
            {t('reasons')}
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[color:var(--color-ink-soft)]">
            {result.findings.map((finding, index) => (
              <li key={`${finding.code}-${index}`}>
                {tMedical(FINDING_MESSAGE_KEY[finding.code])}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild size="lg">
          <a href="#for-donors">{t('ctaFind')}</a>
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={onRestart}>
          {tNav('restart')}
        </Button>
      </div>
    </GlassPanel>
  );
}

function outcomeBadgeStyle(outcome: EligibilityOutcome): React.CSSProperties {
  return {
    color: OUTCOME_TONE[outcome],
    backgroundColor: `color-mix(in oklch, ${OUTCOME_TONE[outcome]} 18%, transparent)`,
  };
}
