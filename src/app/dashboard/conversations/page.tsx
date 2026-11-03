import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { readCanViewChat, readFacilityId, readUserId } from '@/lib/auth/session';
import { ConversationInbox } from './conversation-inbox';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return { title: t('conversationsTitle') };
}

// Tanpa guard di sini: src/proxy.ts memetakan path ini lewat requiredRoleFor (UX
// navigasi), dan otorisasi sebenarnya (chat.view, batas fasilitas) di backend.
export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations('conversations');
  const { conversation } = await searchParams;
  const [canView, facilityId, userId] = await Promise.all([readCanViewChat(), readFacilityId(), readUserId()]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-[color:var(--color-ink-strong)]">{t('heading')}</h1>
      <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">{t('description')}</p>
      <ConversationInbox
        canView={canView}
        // Cookie hilang (undefined) bukan lingkup global: hanya null yang berarti itu.
        globalScope={facilityId === null}
        facilityId={typeof facilityId === 'string' ? facilityId : null}
        currentUserId={userId}
        conversationId={typeof conversation === 'string' ? conversation : null}
      />
    </main>
  );
}
