import { LANDING } from '@/content/landing';

export function SiteFooter() {
  return (
    <footer className="mt-auto flat">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-8 text-sm text-[color:var(--color-ink-soft)]">
        <p>{LANDING.footer.tagline}</p>
        <p className="text-[color:var(--color-ink-dim)]">{LANDING.footer.note} &middot; 2026</p>
      </div>
    </footer>
  );
}
