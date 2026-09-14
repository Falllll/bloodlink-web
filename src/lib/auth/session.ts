import { cookies } from 'next/headers';

const COOKIE = 'bl_token';

export async function readToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export async function writeToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function clearToken(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
