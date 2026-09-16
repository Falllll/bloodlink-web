import type { Metadata } from 'next';
import { SiteHeader } from '@/components/landing/site-header';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { AudienceSection } from '@/components/landing/audience-section';
import { SiteFooter } from '@/components/landing/site-footer';
import { LANDING } from '@/content/landing';

export const metadata: Metadata = {
  title: 'BloodLink — Stok darah antar fasilitas',
  description:
    'BloodLink menyatukan data stok darah antar rumah sakit, bank darah, dan unit donor darah secara real-time.',
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero />
        <HowItWorks />
        <AudienceSection
          id="untuk-donor"
          title={LANDING.donor.title}
          body={LANDING.donor.body}
          points={LANDING.donor.points}
        />
        <AudienceSection
          id="untuk-fasilitas"
          title={LANDING.facility.title}
          body={LANDING.facility.body}
          points={LANDING.facility.points}
        />
      </main>
      <SiteFooter />
    </>
  );
}
