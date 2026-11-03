import type { Role } from '@/lib/api/types';

const HOME: Record<Role, string> = {
  admin: '/admin',
  hospital_staff: '/dashboard',
  donor: '/',
};

// Urutan penting: find() mengambil yang pertama cocok, jadi pengecualian
// /dashboard/conversations harus di atas /dashboard. Admin hanya dibuka di path
// itu; /dashboard selebihnya tetap khusus hospital_staff.
const AREA: ReadonlyArray<{ prefix: string; roles: readonly Role[] }> = [
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/dashboard/conversations', roles: ['hospital_staff', 'admin'] },
  { prefix: '/dashboard', roles: ['hospital_staff'] },
];

export function requiredRoleFor(pathname: string): readonly Role[] | null {
  const area = AREA.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return area ? area.roles : null;
}

export function roleHome(role: string): string {
  return role in HOME ? HOME[role as Role] : '/';
}
