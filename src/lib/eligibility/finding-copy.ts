import type { EligibilityFindingCode, EligibilityOutcome } from '@/lib/api/eligibility';

// Kunci relatif terhadap namespace `medical`.
export const FINDING_MESSAGE_KEY: Record<EligibilityFindingCode, string> = {
  AGE_BELOW_MINIMUM: 'eligibility.AGE_BELOW_MINIMUM',
  AGE_ABOVE_MAXIMUM: 'eligibility.AGE_ABOVE_MAXIMUM',
  DONATION_INTERVAL_NOT_MET: 'eligibility.DONATION_INTERVAL_NOT_MET',
  BODY_WEIGHT_BELOW_MINIMUM: 'eligibility.BODY_WEIGHT_BELOW_MINIMUM',
  ACTIVE_DEFERRAL: 'eligibility.ACTIVE_DEFERRAL',
  DATA_MISSING: 'eligibility.DATA_MISSING',
};

// Token yang benar-benar ada di src/app/globals.css (@theme).
export const OUTCOME_TONE: Record<EligibilityOutcome, string> = {
  eligible: 'var(--color-status-released)',
  not_eligible: 'var(--color-status-discarded)',
  undetermined: 'var(--color-status-testing)',
};
