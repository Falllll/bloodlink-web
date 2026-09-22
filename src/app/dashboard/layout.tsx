import { SignOutButton } from '@/components/auth/sign-out-button';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-end gap-3 px-4 py-4">
        <LocaleSwitcher />
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
