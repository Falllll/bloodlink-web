import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SiteHeader } from '@/components/landing/site-header';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { AudienceSection } from '@/components/landing/audience-section';
import { SiteFooter } from '@/components/landing/site-footer';

const POINT_KEYS = ['p1', 'p2', 'p3'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function Home() {
  const t = await getTranslations('landing');

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <HowItWorks />
        <AudienceSection
          id="for-donors"
          title={t('donor.title')}
          body={t('donor.body')}
          points={POINT_KEYS.map((key) => t(`donor.points.${key}`))}
        />
        <AudienceSection
          id="for-facilities"
          title={t('facility.title')}
          body={t('facility.body')}
          points={POINT_KEYS.map((key) => t(`facility.points.${key}`))}
        />
      </main>
      <SiteFooter />
    </>
  );
}
