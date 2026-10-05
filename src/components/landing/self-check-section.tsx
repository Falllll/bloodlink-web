import { useTranslations } from 'next-intl';
import { SelfCheckForm } from '@/components/landing/self-check/self-check-form';

export function SelfCheckSection() {
  const t = useTranslations('selfCheck');

  return (
    <section id="cek-kelayakan" className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
        {t('heading')}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">{t('subtitle')}</p>
      <div className="mt-8">
        <SelfCheckForm />
      </div>
    </section>
  );
}
