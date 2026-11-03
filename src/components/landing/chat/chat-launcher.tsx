'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ChatLauncher({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('chat');

  return (
    <Button type="button" size="lg" className="fixed right-4 bottom-4 z-50 shadow-lg" onClick={onOpen}>
      <MessageCircle aria-hidden="true" />
      {t('open')}
    </Button>
  );
}
