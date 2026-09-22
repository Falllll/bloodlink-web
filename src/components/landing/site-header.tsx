import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';

export function SiteHeader() {
  const t = useTranslations('landing');
  const common = useTranslations('common');

  const nav = [
    { href: '#cara-kerja', label: t('nav.howItWorks') },
    { href: '#for-donors', label: t('nav.forDonors') },
    { href: '#for-facilities', label: t('nav.forFacilities') },
  ];

  return (
    <header className="sticky top-0 z-30 flat">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]"
        >
          {t('brand')}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink-strong)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Button size="sm" variant="outline" asChild>
            <Link href="/login">{common('signIn')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
