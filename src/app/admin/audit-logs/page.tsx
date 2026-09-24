import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AuditLogView } from './audit-log-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('auditTitle') };
}

export default async function AuditLogsPage() {
  const t = await getTranslations('audit');

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
        {t('heading')}
      </h1>
      <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('description')}</p>
      <AuditLogView />
    </main>
  );
}
