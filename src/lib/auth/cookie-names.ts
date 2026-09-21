import type { Role } from '@/lib/api/types';

export const TOKEN_COOKIE = 'bl_token';
export const ROLE_COOKIE = 'bl_role';

const ROLES: readonly Role[] = ['donor', 'hospital_staff', 'admin'];

export function isRole(value: string | undefined): value is Role {
  return value !== undefined && (ROLES as readonly string[]).includes(value);
}
