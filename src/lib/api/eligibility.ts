import { apiFetch } from '@/lib/api/client';
import type { ApiSuccess } from '@/lib/api/types';

export type EligibilityOutcome = 'eligible' | 'not_eligible' | 'undetermined';

export type EligibilityFindingCode =
  | 'AGE_BELOW_MINIMUM'
  | 'AGE_ABOVE_MAXIMUM'
  | 'DONATION_INTERVAL_NOT_MET'
  | 'BODY_WEIGHT_BELOW_MINIMUM'
  | 'ACTIVE_DEFERRAL'
  | 'DATA_MISSING';

export type EligibilityFinding = {
  code: EligibilityFindingCode;
  outcome: EligibilityOutcome;
  retry_after_date: string | null; // 'yyyy-mm-dd'
  detail: string | null;           // JANGAN ditampilkan ke pengguna
};

export type EligibilitySelfCheck = {
  outcome: EligibilityOutcome;
  is_provisional: true;            // selalu true untuk pemanggil anonim
  retry_after_date: string | null; // 'yyyy-mm-dd'
  findings: EligibilityFinding[];
};

// Hanya lima kunci ini. Kunci lain ditolak 422 dengan rule `not_allowed`.
export type SelfCheckPayload = {
  date_of_birth: string;                // wajib, 'yyyy-mm-dd', harus sebelum hari ini
  sex: 'male' | 'female';               // wajib
  weight_kg?: number;                   // opsional, 20..300
  last_donation_date?: string;          // opsional, 'yyyy-mm-dd', <= hari ini
  planned_volume_ml?: 350 | 450;        // opsional, hanya 350 atau 450
};

export const SELF_CHECK_PATH = '/eligibility/self-check';

export function postSelfCheck(
  payload: SelfCheckPayload,
): Promise<ApiSuccess<EligibilitySelfCheck>> {
  // Route publik tanpa EnsureIdempotency — sengaja tanpa header idempotency-key.
  return apiFetch<ApiSuccess<EligibilitySelfCheck>>(SELF_CHECK_PATH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
