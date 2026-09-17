import type { Metadata } from 'next';
import { GlassPanel } from '@/components/ui/glass-panel';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Masuk — BloodLink',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <GlassPanel className="w-full max-w-sm p-8">
        <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">
          Masuk
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">
          Masuk untuk mengakses BloodLink sesuai peranmu.
        </p>
        <LoginForm />
      </GlassPanel>
    </main>
  );
}
