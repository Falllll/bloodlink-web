'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { getMessageFallback, onIntlError } from './fallback';
import type { Locale } from './routing';

export function IntlClientProvider(props: {
  locale: Locale;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={props.locale}
      messages={props.messages}
      timeZone="Asia/Jakarta"
      onError={onIntlError}
      getMessageFallback={getMessageFallback}
    >
      {props.children}
    </NextIntlClientProvider>
  );
}
