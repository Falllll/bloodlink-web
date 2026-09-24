import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { GlassPanel } from '@/components/ui/glass-panel';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('adminTitle') };
}

export default async function AdminPage() {
  const t = await getTranslations('shell');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <GlassPanel className="p-8">
        <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          {t('adminHeading')}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('adminPending')}</p>
        <Link
          href="/admin/audit-logs"
          className="mt-4 inline-block text-sm font-medium text-[color:var(--color-ink-strong)] underline underline-offset-4 hover:text-[color:var(--color-ink-soft)]"
        >
          {t('adminAuditLink')}
        </Link>
      </GlassPanel>
    </main>
  );
}
