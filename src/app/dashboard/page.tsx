import type { Metadata } from 'next';
import { GlassPanel } from '@/components/ui/glass-panel';

export const metadata: Metadata = {
  title: 'Dashboard Petugas — BloodLink',
};

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <GlassPanel className="p-8">
        <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          Dashboard Petugas
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">
          Isi dashboard (stok, permintaan, matching) hadir di Kartu 540.
        </p>
      </GlassPanel>
    </main>
  );
}
