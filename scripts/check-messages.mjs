import { readFileSync } from 'node:fs';

const LOCALES = ['id', 'en', 'de', 'ja', 'zh'];
const UNREVIEWED = ['de', 'ja', 'zh'];
const ERROR_CODES = ['VALIDATION_FAILED', 'UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL_ERROR', 'METHOD_NOT_ALLOWED', 'TOO_MANY_REQUESTS', 'HTTP_ERROR', 'IDEMPOTENCY_KEY_REQUIRED', 'IDEMPOTENCY_KEY_REUSED', 'REQUEST_IN_PROGRESS'];

/** @returns {string[]} */
function flatKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flatKeys(value, path));
    } else {
      keys.push(path);
    }
  }

  return keys;
}

function loadMessages(locale) {
  return JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8'));
}

const messages = Object.fromEntries(LOCALES.map((locale) => [locale, loadMessages(locale)]));

let ok = true;

function report(label, missing, extra) {
  if (missing.length > 0) {
    ok = false;
    console.error(`${label}: missing keys: ${missing.join(', ')}`);
  }

  if (extra.length > 0) {
    ok = false;
    console.error(`${label}: unexpected keys: ${extra.join(', ')}`);
  }
}

const enKeys = new Set(flatKeys(messages.en));

const idKeys = new Set(flatKeys(messages.id));
report(
  'id',
  [...enKeys].filter((k) => !idKeys.has(k)),
  [...idKeys].filter((k) => !enKeys.has(k)),
);

const enKeysNoMedical = new Set([...enKeys].filter((k) => k !== 'medical' && !k.startsWith('medical.')));

for (const locale of UNREVIEWED) {
  const keys = new Set(flatKeys(messages[locale]));
  const hasMedical = [...keys].some((k) => k === 'medical' || k.startsWith('medical.'));

  if (hasMedical || 'medical' in messages[locale]) {
    ok = false;
    console.error(`${locale}: must not contain 'medical' namespace`);
  }

  report(
    locale,
    [...enKeysNoMedical].filter((k) => !keys.has(k)),
    [...keys].filter((k) => !enKeysNoMedical.has(k)),
  );
}

for (const locale of LOCALES) {
  const errors = messages[locale].errors ?? {};

  for (const code of ERROR_CODES) {
    if (!(code in errors)) {
      ok = false;
      console.error(`${locale}: missing errors.${code}`);
    }
  }
}

if (!ok) {
  process.exit(1);
}
