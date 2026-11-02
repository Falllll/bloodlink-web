import type { ApiPaginated } from '@/lib/api/types';
import { newIdempotencyKey } from '@/lib/api/client';

export type StaffRole = 'hospital_staff' | 'admin';

export type StaffAccount = {
  id: string;
  name: string;
  email: string;
  facility_id: string;
  // Jujur terhadap respons API: backend bisa memulangkan peran di luar StaffRole.
  role: string | null;
  is_active: boolean;
  created_at: string | null;
};

export type StaffPage = ApiPaginated<StaffAccount>;
// '' berarti "jangan filter"; filter[is_active] dikirim sebagai string query.
export type StaffFilters = { isActive?: '' | 'true' | 'false' };

export const STAFF_ROLES: readonly StaffRole[] = ['hospital_staff', 'admin'];
export const STAFF_PER_PAGE = 25;

export function isAssignableRole(role: string | null): role is StaffRole {
  return (STAFF_ROLES as readonly (string | null)[]).includes(role);
}

export function buildStaffPath(filters: StaffFilters, cursor: string | null): string {
  const params = new URLSearchParams();

  if (filters.isActive) params.set('filter[is_active]', filters.isActive);
  params.set('per_page', String(STAFF_PER_PAGE));
  params.set('sort', 'name');
  if (cursor !== null) params.set('cursor', cursor);

  return `/users?${params.toString()}`;
}

// Dipanggil sekali di handler aksi pengguna; [path, init] yang sama dipakai
// ulang di setiap percobaan aksi itu supaya Idempotency-Key-nya tidak berganti.
export function inviteStaffInit(input: { name: string; email: string; facility_id: string; role: StaffRole }): [string, RequestInit] {
  return [
    '/users',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': newIdempotencyKey(),
      },
      // Tepat empat key: StrictRequest membalas key lain 422 not_allowed.
      body: JSON.stringify(input),
    },
  ];
}

// Bukan patch parsial: facility_id dan role keduanya required.
export function assignStaffInit(id: string, input: { facility_id: string; role: StaffRole }): [string, RequestInit] {
  return [
    `/users/${encodeURIComponent(id)}/assignment`,
    {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': newIdempotencyKey(),
      },
      body: JSON.stringify(input),
    },
  ];
}

export function setStaffActiveInit(id: string, active: boolean): [string, RequestInit] {
  const target = encodeURIComponent(id);

  return [
    active ? `/users/${target}/activate` : `/users/${target}/deactivate`,
    {
      method: active ? 'POST' : 'PATCH',
      headers: { 'idempotency-key': newIdempotencyKey() },
    },
  ];
}
