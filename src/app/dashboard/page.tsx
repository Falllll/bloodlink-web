import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GlassPanel } from '@/components/ui/glass-panel';
import { InventoryTable } from './inventory-table';
import { UrgentRequestForm } from './urgent-request-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('dashboardTitle') };
}

// Tanpa pengecekan peran di sini: src/proxy.ts memetakan /dashboard lewat
// requiredRoleFor (UX navigasi), otorisasi sebenarnya di backend.
export default async function DashboardPage() {
  const t = await getTranslations('shell');

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
        {t('dashboardHeading')}
      </h1>
      {/* Satu GlassPanel per bagian; komponen di dalamnya tidak menambah lapis blur. */}
      <GlassPanel className="mt-6 p-6">
        <UrgentRequestForm />
      </GlassPanel>
      <GlassPanel className="mt-6 p-6">
        <InventoryTable />
      </GlassPanel>
    </main>
  );
}
