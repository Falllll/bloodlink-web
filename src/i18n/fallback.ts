import { IntlErrorCode, type IntlError } from 'next-intl';
import { MEDICAL_REVIEWED, type Locale } from './routing';

export type Messages = Record<string, unknown>;

export function withMedicalFallback(own: Messages, en: Messages, locale: Locale): Messages {
  if (MEDICAL_REVIEWED.includes(locale)) {
    return own;
  }

  return { ...own, medical: en.medical };
}

export function onIntlError(error: IntlError): void {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    console.error(error);
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(error);
    return;
  }

  throw error;
}

export function getMessageFallback(info: { namespace?: string; key: string; error: IntlError }): string {
  return `⟦${[info.namespace, info.key].filter(Boolean).join('.')}⟧`;
}
