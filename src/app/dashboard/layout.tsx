import { SignOutButton } from '@/components/auth/sign-out-button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex justify-end px-4 py-4">
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
