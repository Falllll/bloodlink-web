import { useTranslations } from 'next-intl';
import { GlassPanel } from '@/components/ui/glass-panel';

const STEPS = ['step1', 'step2', 'step3'] as const;

export function HowItWorks() {
  const t = useTranslations('landing.howItWorks');

  return (
    <section id="cara-kerja" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
        {t('heading')}
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <GlassPanel key={step} className="flex flex-col gap-2 p-6">
            <span className="font-display text-3xl text-[color:var(--color-ink-dim)]">
              {t(`${step}.step`)}
            </span>
            <h3 className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]">
              {t(`${step}.title`)}
            </h3>
            <p className="text-sm text-[color:var(--color-ink-soft)]">{t(`${step}.body`)}</p>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
