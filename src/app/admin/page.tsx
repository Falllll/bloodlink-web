import type { Metadata } from 'next';
import { GlassPanel } from '@/components/ui/glass-panel';

export const metadata: Metadata = {
  title: 'Panel Admin — BloodLink',
};

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <GlassPanel className="p-8">
        <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          Panel Admin
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">
          Isi panel admin (verifikasi institusi, blacklist, audit viewer) hadir di Kartu 550.
        </p>
      </GlassPanel>
    </main>
  );
}
