import type { Role } from '@/lib/api/types';

const HOME: Record<Role, string> = {
  admin: '/admin',
  hospital_staff: '/dashboard',
  donor: '/',
};

const AREA: ReadonlyArray<{ prefix: string; role: Role }> = [
  { prefix: '/admin', role: 'admin' },
  { prefix: '/dashboard', role: 'hospital_staff' },
];

export function requiredRoleFor(pathname: string): Role | null {
  const area = AREA.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return area ? area.role : null;
}

export function roleHome(role: string): string {
  return role in HOME ? HOME[role as Role] : '/';
}
