import { NextRequest } from 'next/server';
import { readToken, clearToken } from '@/lib/auth/session';

const FORWARD_HEADERS = ['content-type', 'idempotency-key', 'x-request-id', 'accept-language'];

async function forward(req: NextRequest, path: string[]): Promise<Response> {
  const url = `${process.env.API_BASE_URL}/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = req.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  const token = await readToken();
  if (token !== null) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // @ts-expect-error -- required by undici when streaming a body
    duplex: hasBody ? 'half' : undefined,
  });

  if (upstream.status === 401) {
    await clearToken();
    return Response.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Sesi berakhir' } },
      { status: 401 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of ['content-type', 'cache-control', 'etag']) {
    const value = upstream.headers.get(name);
    if (value !== null) responseHeaders.set(name, value);
  }
  const requestId = upstream.headers.get('x-request-id');
  if (requestId !== null) responseHeaders.set('x-request-id', requestId);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
