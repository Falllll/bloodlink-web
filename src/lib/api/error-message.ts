import type { ErrorCode } from './types';

const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: 'Ada isian yang belum benar.',
  UNAUTHENTICATED: 'Sesimu sudah berakhir. Masuk lagi, ya.',
  FORBIDDEN: 'Kamu tidak punya akses ke bagian ini.',
  NOT_FOUND: 'Data yang dicari tidak ditemukan.',
  INTERNAL_ERROR: 'Terjadi kesalahan di server. Coba lagi nanti.',
  METHOD_NOT_ALLOWED: 'Permintaan ini tidak didukung.',
  TOO_MANY_REQUESTS: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
  HTTP_ERROR: 'Terjadi kesalahan saat menghubungi server.',
  IDEMPOTENCY_KEY_REQUIRED: 'Permintaan ini tidak lengkap. Coba lagi.',
  IDEMPOTENCY_KEY_REUSED: 'Permintaan ini sudah pernah diproses.',
  REQUEST_IN_PROGRESS: 'Permintaan sebelumnya masih diproses. Tunggu sebentar.',
};

const FALLBACK_MESSAGE = 'Terjadi kesalahan yang tidak terduga.';

export function messageFor(code: ErrorCode): string {
  return MESSAGES[code] ?? FALLBACK_MESSAGE;
}
