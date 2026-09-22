'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from 'cn';
import { setLocale } from '@/i18n/actions';
import { LOCALES, LOCALE_LABELS, isLocale } from '@/i18n/routing';

export function LocaleSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label={t('language')}
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value;
        if (!isLocale(value)) return;
        startTransition(async () => {
          await setLocale(value);
          router.refresh();
        });
      }}
      className={cn(
        'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
      )}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
