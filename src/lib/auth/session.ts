import { cookies } from 'next/headers';
import type { Role } from '@/lib/api/types';
import { ROLE_COOKIE, TOKEN_COOKIE, isRole } from '@/lib/auth/cookie-names';

export async function readToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

export async function writeToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function writeRole(role: string): Promise<void> {
  const store = await cookies();
  store.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function readRole(): Promise<Role | null> {
  const store = await cookies();
  const value = store.get(ROLE_COOKIE)?.value;
  return isRole(value) ? value : null;
}

export async function clearToken(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(ROLE_COOKIE);
}
