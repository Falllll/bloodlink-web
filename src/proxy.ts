import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROLE_COOKIE, TOKEN_COOKIE, isRole } from '@/lib/auth/cookie-names';
import { requiredRoleFor, roleHome } from '@/lib/auth/roles';

// Penjaga ini murni UX navigasi, BUKAN batas keamanan. Cookie `bl_role` bisa
// diedit pengguna lewat DevTools sehingga dia bisa membuka `/admin`, tetapi
// yang didapat hanya cangkang kosong: semua data datang dari API yang
// otorisasinya ditegakkan backend (Spatie, Kartu 70; hardening, Kartu 95).
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const needed = requiredRoleFor(pathname);
  if (needed === null) return NextResponse.next();

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (!token || !isRole(role)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (role !== needed) {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!bff|api|_next/static|_next/image|favicon.ico).*)'],
};
