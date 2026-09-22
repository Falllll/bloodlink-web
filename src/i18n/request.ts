import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { getMessageFallback, onIntlError, withMedicalFallback } from './fallback';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './routing';

export default getRequestConfig(async () => {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  const own = (await import(`../../messages/${locale}.json`)).default;
  const en = (await import('../../messages/en.json')).default;

  return {
    locale,
    messages: withMedicalFallback(own, en, locale),
    timeZone: 'Asia/Jakarta',
    onError: onIntlError,
    getMessageFallback,
  };
});
