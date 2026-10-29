import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { readFacilityId } from '@/lib/auth/session';
import { StockMapIsland } from '@/components/map/stock-map-island';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('mapTitle') };
}

export default async function MapPage() {
  const t = await getTranslations('map');
  // undefined = cookie tidak ada, null = operator global ('global'); keduanya
  // tidak dioper. Hanya public_id sungguhan, dan hanya untuk presentasi.
  const facilityId = await readFacilityId();
  const selfFacilityId = typeof facilityId === 'string' ? facilityId : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
        {t('heading')}
      </h1>
      <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('description')}</p>
      <StockMapIsland selfFacilityId={selfFacilityId} />
    </main>
  );
}
