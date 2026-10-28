import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';

const NAV_LINK =
  'text-sm font-medium text-[color:var(--color-ink-strong)] underline underline-offset-4 hover:text-[color:var(--color-ink-soft)]';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('shell');

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-3 px-4 py-4">
        <nav aria-label={t('navLabel')} className="flex flex-wrap items-center gap-4">
          <Link href="/admin/facilities" className={NAV_LINK}>
            {t('navFacilities')}
          </Link>
          <Link href="/admin/donors" className={NAV_LINK}>
            {t('navDonors')}
          </Link>
          <Link href="/admin/audit-logs" className={NAV_LINK}>
            {t('navAuditLogs')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
