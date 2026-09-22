import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GlassPanel } from '@/components/ui/glass-panel';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { LoginForm } from './login-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('loginTitle') };
}

export default async function LoginPage() {
  const t = await getTranslations('login');

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <GlassPanel className="w-full max-w-sm p-8">
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>
        <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('subtitle')}</p>
        <LoginForm />
      </GlassPanel>
    </main>
  );
}
