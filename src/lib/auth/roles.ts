import type { Role } from '@/lib/api/types';

const HOME: Record<Role, string> = {
  admin: '/admin',
  hospital_staff: '/dashboard',
  donor: '/',
};

export function roleHome(role: string): string {
  return role in HOME ? HOME[role as Role] : '/';
}
