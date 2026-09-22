import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function Hero() {
  const t = useTranslations('landing.hero');

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-24 text-left">
      <h1 className="font-display text-4xl font-semibold text-[color:var(--color-ink-strong)] sm:text-5xl">
        {t('title')}
      </h1>
      <p className="text-lg text-[color:var(--color-ink-soft)]">{t('subtitle')}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <a href="#for-donors">{t('ctaPrimary')}</a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#for-facilities">{t('ctaSecondary')}</a>
        </Button>
      </div>
    </section>
  );
}
