import type { ApiPaginated } from '@/lib/api/types';
import { newIdempotencyKey } from '@/lib/api/client';

export type FacilityType = 'hospital' | 'blood_bank' | 'donation_unit' | 'mobile_unit';

export type FacilityRow = {
  id: string;
  code: string;
  name: string;
  type: FacilityType;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string | null;
  is_active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type FacilityPage = ApiPaginated<FacilityRow>;

// Peta (kartu 560). isSelf hanya petunjuk presentasi -- warna marker dan
// pemusatan -- tidak pernah dipakai menyaring data atau memutuskan izin.
export type FacilityPin = Pick<FacilityRow, 'id' | 'name' | 'latitude' | 'longitude'> & {
  isSelf: boolean;
};

// Batas keras penelusuran halaman /facilities untuk peta: lewat dari ini,
// daftarnya ditandai terpotong alih-alih terus mengambil.
export const FACILITY_MAP_MAX_PAGES = 10;
// Batas atas per_page di backend (AppliesListQuery): 10 x 100 = 1000 fasilitas.
export const FACILITY_MAP_PER_PAGE = 100;

export type FacilityFilters = {
  type?: FacilityType | '';
  city?: string;
  province?: string;
  isActive?: 'true' | 'false' | '';
};

export const FACILITY_TYPES: readonly FacilityType[] = ['hospital', 'blood_bank', 'donation_unit', 'mobile_unit'];
export const FACILITY_PER_PAGE = 25;

// filter[...] yang DIIZINKAN backend hanya: type, city, province, is_active.
// TIDAK ADA filter verifikasi -- key asing dibalas 422 rule unsupported_filter.
export function buildFacilityPath(
  filters: FacilityFilters,
  cursor: string | null,
  perPage: number = FACILITY_PER_PAGE,
): string {
  const params = new URLSearchParams();

  const entries: ReadonlyArray<[string, string | undefined]> = [
    ['filter[type]', filters.type],
    ['filter[city]', filters.city],
    ['filter[province]', filters.province],
    ['filter[is_active]', filters.isActive],
  ];

  for (const [name, value] of entries) {
    const trimmed = value?.trim();
    if (trimmed) params.set(name, trimmed);
  }

  params.set('per_page', String(perPage));
  params.set('sort', 'name');
  if (cursor !== null) params.set('cursor', cursor);

  return `/facilities?${params.toString()}`;
}

// Dipanggil sekali di handler aksi pengguna; [path, init] yang sama dipakai
// ulang di setiap percobaan aksi itu supaya Idempotency-Key-nya tidak berganti.
export function verifyFacilityInit(facilityId: string, note: string): [string, RequestInit] {
  return [
    `/facilities/${encodeURIComponent(facilityId)}/verify`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': newIdempotencyKey(),
      },
      // HANYA note: StrictRequest membalas key lain 422. Catatan opsional;
      // kosong dikirim sebagai body tanpa key, bukan string kosong.
      body: JSON.stringify(note.trim() === '' ? {} : { note }),
    },
  ];
}
