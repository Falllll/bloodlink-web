import { clearToken, readToken } from '@/lib/auth/session';

import { NextRequest } from 'next/server';

export async function POST(req: NextRequest): Promise<Response> {
  const token = await readToken();

  if (token !== null) {
    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    const key = req.headers.get('idempotency-key');
    if (key) headers.set('idempotency-key', key);

    try {
      await fetch(`${process.env.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Best-effort: token sudah mati, timeout, atau jaringan putus tidak boleh menggagalkan logout lokal.
    }
  }

  await clearToken();
  return Response.json({ data: {} });
}
