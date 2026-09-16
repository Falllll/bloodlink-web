import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LANDING } from '@/content/landing';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flat">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]"
        >
          {LANDING.brand}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {LANDING.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink-strong)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Button
          size="sm"
          variant="outline"
          disabled
          title="Halaman masuk menyusul (Kartu 520)"
        >
          Masuk
        </Button>
      </div>
    </header>
  );
}
