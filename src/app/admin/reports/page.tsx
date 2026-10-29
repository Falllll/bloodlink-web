import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ReportsView } from './reports-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('reportsTitle') };
}

export default async function ReportsPage() {
  const t = await getTranslations('reports');

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
        {t('heading')}
      </h1>
      <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('description')}</p>
      <ReportsView />
    </main>
  );
}
