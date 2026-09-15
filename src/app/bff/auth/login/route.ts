import { NextRequest } from 'next/server';
import { writeToken } from '@/lib/auth/session';

export async function POST(req: NextRequest): Promise<Response> {
  const upstream = await fetch(`${process.env.API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': req.headers.get('content-type') ?? 'application/json' },
    body: req.body,
    // @ts-expect-error -- required by undici when streaming a body
    duplex: 'half',
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  }

  const body = await upstream.json();
  await writeToken(body.data.token);

  return Response.json({ data: { user: body.data.user } });
}
