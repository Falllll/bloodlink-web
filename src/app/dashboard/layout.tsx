import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { readCanViewChat, readFacilityId, readRole } from '@/lib/auth/session';
import { ConversationsNavLink } from './conversations/conversation-inbox';

const NAV_LINK =
  'text-sm font-medium text-[color:var(--color-ink-strong)] underline underline-offset-4 hover:text-[color:var(--color-ink-soft)]';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('shell');
  const [role, canViewChat, facilityId] = await Promise.all([readRole(), readCanViewChat(), readFacilityId()]);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-3 px-4 py-4">
        <nav aria-label={t('dashboardNavLabel')} className="flex flex-wrap items-center gap-4">
          {/* Admin hanya boleh di kotak masuk; /dashboard lainnya akan melemparnya ke /admin. */}
          {role === 'admin' ? (
            <Link href="/admin" className={NAV_LINK}>
              {t('adminHeading')}
            </Link>
          ) : (
            <>
              <Link href="/dashboard" className={NAV_LINK}>
                {t('navDashboard')}
              </Link>
              <Link href="/dashboard/map" className={NAV_LINK}>
                {t('navMap')}
              </Link>
            </>
          )}
          {canViewChat && (
            <ConversationsNavLink facilityId={typeof facilityId === 'string' ? facilityId : null} className={NAV_LINK} />
          )}
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
