export const LOCALES = ['id', 'en', 'de', 'ja', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'id';
export const LOCALE_COOKIE = 'bl_locale';
// Locales whose `medical` namespace has been reviewed by a human.
export const MEDICAL_REVIEWED: readonly Locale[] = ['id', 'en'];
// Autonyms are not translated.
export const LOCALE_LABELS: Record<Locale, string> = {
  id: 'Bahasa Indonesia', en: 'English', de: 'Deutsch', ja: '日本語', zh: '中文',
};

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}
