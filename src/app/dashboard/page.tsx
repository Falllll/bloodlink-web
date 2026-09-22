import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GlassPanel } from '@/components/ui/glass-panel';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('dashboardTitle') };
}

export default async function DashboardPage() {
  const t = await getTranslations('shell');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <GlassPanel className="p-8">
        <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          {t('dashboardHeading')}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('dashboardPending')}</p>
      </GlassPanel>
    </main>
  );
}
