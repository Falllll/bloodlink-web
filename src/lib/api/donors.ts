import type { ApiPaginated } from '@/lib/api/types';
import { newIdempotencyKey } from '@/lib/api/client';

export type DeferralStatus = 'none' | 'temporary' | 'permanent';

export type DonorBloodGroup = 'A' | 'B' | 'AB' | 'O';
export type DonorRhFactor = 'positive' | 'negative';
export type DonorSex = 'male' | 'female';

export type DonorRow = {
  id: string;
  donor_number: string;
  full_name: string;
  sex: DonorSex;
  blood_group: DonorBloodGroup | null;
  rh_factor: DonorRhFactor | null;
  city: string;
  last_donation_date: string | null;
  donation_count: number;
  deferral_status: DeferralStatus;
};

export type DonorPage = ApiPaginated<DonorRow>;

export type DonorFilters = {
  search?: string;
  bloodGroup?: DonorBloodGroup | '';
  rhFactor?: DonorRhFactor | '';
  sex?: DonorSex | '';
  city?: string;
  deferralStatus?: DeferralStatus | '';
};

export type DonorFlagReason = 'identity_fraud' | 'repeated_no_show' | 'staff_safety' | 'other';

export type DonorFlagRow = {
  id: string;
  donor_id: string;
  reason: DonorFlagReason;
  note: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  lifted_at: string | null;
  lift_note: string | null;
};

export type DonorFlagPage = ApiPaginated<DonorFlagRow>;

export type PlaceDonorFlagBody = { reason: DonorFlagReason; note: string; ends_at: string | null };

export const DONOR_FLAG_REASONS: readonly DonorFlagReason[] = ['identity_fraud', 'repeated_no_show', 'staff_safety', 'other'];
export const DEFERRAL_STATUSES: readonly DeferralStatus[] = ['none', 'temporary', 'permanent'];
export const DONOR_BLOOD_GROUPS: readonly DonorBloodGroup[] = ['A', 'B', 'AB', 'O'];
export const DONOR_RH_FACTORS: readonly DonorRhFactor[] = ['positive', 'negative'];
export const DONOR_SEXES: readonly DonorSex[] = ['male', 'female'];
export const DONOR_PER_PAGE = 25;
export const DONOR_FLAG_NOTE_MAX = 2000;
export const DONOR_FLAG_LIFT_REASON_MAX = 1000;

// `search` adalah param TOP-LEVEL (pg_trgm, kemiripan -- bukan awalan), bukan
// filter[...]. filter[...] yang diizinkan hanya blood_group, rh_factor, sex,
// city, deferral_status; key asing dibalas 422 rule unsupported_filter.
export function buildDonorPath(filters: DonorFilters, cursor: string | null): string {
  const params = new URLSearchParams();

  const entries: ReadonlyArray<[string, string | undefined]> = [
    ['search', filters.search],
    ['filter[blood_group]', filters.bloodGroup],
    ['filter[rh_factor]', filters.rhFactor],
    ['filter[sex]', filters.sex],
    ['filter[city]', filters.city],
    ['filter[deferral_status]', filters.deferralStatus],
  ];

  for (const [name, value] of entries) {
    const trimmed = value?.trim();
    if (trimmed) params.set(name, trimmed);
  }

  params.set('per_page', String(DONOR_PER_PAGE));
  params.set('sort', 'full_name');
  if (cursor !== null) params.set('cursor', cursor);

  return `/donors?${params.toString()}`;
}

// activeOnly=true memakai definisi "aktif" milik backend (FlagDonor::whereActive),
// jadi FE tidak menebak dari ends_at/lifted_at sendiri.
export function buildDonorFlagsPath(donorId: string, activeOnly: boolean): string {
  const params = new URLSearchParams();

  if (activeOnly) params.set('filter[active]', '1');
  params.set('per_page', String(DONOR_PER_PAGE));
  params.set('sort', '-starts_at');

  return `/donors/${encodeURIComponent(donorId)}/flags?${params.toString()}`;
}

// Dipanggil sekali di handler aksi pengguna; [path, init] yang sama dipakai
// ulang di setiap percobaan aksi itu supaya Idempotency-Key-nya tidak berganti.
export function placeDonorFlagInit(donorId: string, body: PlaceDonorFlagBody): [string, RequestInit] {
  return [
    `/donors/${encodeURIComponent(donorId)}/flags`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': newIdempotencyKey(),
      },
      // Donor SELALU dari path: donor_id di body ditolak 422.
      body: JSON.stringify(body),
    },
  ];
}

// Flag dicabut lewat POST /donor-flags/{id}/lift -- BUKAN PATCH seperti
// /deferrals/{id}/lift. Dua kanal berbeda, jangan disamakan.
export function liftDonorFlagInit(flagId: string, reason: string): [string, RequestInit] {
  return [
    `/donor-flags/${encodeURIComponent(flagId)}/lift`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': newIdempotencyKey(),
      },
      body: JSON.stringify({ reason }),
    },
  ];
}
