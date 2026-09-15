import { clearToken } from '@/lib/auth/session';

export async function POST(): Promise<Response> {
  await clearToken();
  return Response.json({ data: {} });
}
