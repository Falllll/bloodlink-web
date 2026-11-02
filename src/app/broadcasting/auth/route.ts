import { NextRequest } from 'next/server';
import { readToken } from '@/lib/auth/session';

// Otorisasi channel privat Echo. Token ada di cookie httpOnly dan tidak pernah
// sampai ke JavaScript, dan config/cors.php backend hanya membuka api/*, jadi
// browser tidak bisa memanggil /broadcasting/auth Laravel langsung.
export async function POST(req: NextRequest) {
  const token = await readToken();
  if (token === null) {
    return Response.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Sesi berakhir' } },
      { status: 401 },
    );
  }

  // Endpoint ini di luar /api/v1, jadi segmen itu dipotong dari API_BASE_URL.
  const origin = `${process.env.API_BASE_URL}`.replace(/\/api\/v1\/?$/, '');

  const headers = new Headers({
    // Tanpa ini auth:sanctum menjawab redirect ke login, bukan 401/403 JSON.
    accept: 'application/json',
    Authorization: `Bearer ${token}`,
  });
  const contentType = req.headers.get('content-type');
  if (contentType !== null) headers.set('content-type', contentType);

  const upstream = await fetch(`${origin}/broadcasting/auth`, {
    method: 'POST',
    headers,
    body: await req.text(),
  });

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType !== null) responseHeaders.set('content-type', upstreamType);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
