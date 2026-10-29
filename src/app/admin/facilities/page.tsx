import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { readCanManage } from '@/lib/auth/session';
import { FacilityView } from './facility-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('facilitiesTitle') };
}

export default async function FacilitiesPage() {
  const t = await getTranslations('facilities');
  // Hanya boolean yang menyeberang ke klien; role/facility_id mentah tidak.
  const canManage = await readCanManage();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
        {t('heading')}
      </h1>
      <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('description')}</p>
      <FacilityView canManage={canManage} />
    </main>
  );
}
