import { Button } from '@/components/ui/button';
import { LANDING } from '@/content/landing';

export function Hero() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-24 text-left">
      <h1 className="font-display text-4xl font-semibold text-[color:var(--color-ink-strong)] sm:text-5xl">
        {LANDING.hero.title}
      </h1>
      <p className="text-lg text-[color:var(--color-ink-soft)]">{LANDING.hero.subtitle}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <a href={LANDING.hero.ctaPrimary.href}>{LANDING.hero.ctaPrimary.label}</a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={LANDING.hero.ctaSecondary.href}>{LANDING.hero.ctaSecondary.label}</a>
        </Button>
      </div>
    </section>
  );
}
