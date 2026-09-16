import { LANDING } from '@/content/landing';
import { GlassPanel } from '@/components/ui/glass-panel';

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
        Cara kerja
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {LANDING.howItWorks.map((item) => (
          <GlassPanel key={item.step} className="flex flex-col gap-2 p-6">
            <span className="font-display text-3xl text-[color:var(--color-ink-dim)]">
              {item.step}
            </span>
            <h3 className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]">
              {item.title}
            </h3>
            <p className="text-sm text-[color:var(--color-ink-soft)]">{item.body}</p>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}
