import { Check } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';

type AudienceSectionProps = {
  id: string;
  title: string;
  body: string;
  points: readonly string[];
};

export function AudienceSection({ id, title, body, points }: AudienceSectionProps) {
  return (
    <section id={id} className="mx-auto max-w-5xl px-6 py-16">
      <GlassPanel className="flex flex-col gap-4 p-8">
        <h2 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          {title}
        </h2>
        <p className="text-[color:var(--color-ink-soft)]">{body}</p>
        <ul className="flex flex-col gap-2">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm text-[color:var(--color-ink-soft)]">
              <Check className="size-4 shrink-0 text-[color:var(--color-ink-dim)]" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </section>
  );
}
