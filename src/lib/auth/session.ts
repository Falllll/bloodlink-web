import { cookies } from 'next/headers';
import type { Role } from '@/lib/api/types';
import { FACILITY_COOKIE, ROLE_COOKIE, TOKEN_COOKIE, isRole } from '@/lib/auth/cookie-names';

export async function readToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

export async function writeToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function writeRole(role: string): Promise<void> {
  const store = await cookies();
  store.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function readRole(): Promise<Role | null> {
  const store = await cookies();
  const value = store.get(ROLE_COOKIE)?.value;
  return isRole(value) ? value : null;
}

// Operator global (facility_id null) disimpan sebagai penanda eksplisit, bukan
// sebagai cookie yang absen: cookie yang hilang berarti "tidak diketahui" dan
// harus gagal tertutup, bukan diam-diam dianggap admin global.
const GLOBAL_FACILITY = 'global';

export async function writeFacilityId(facilityId: string | null | undefined): Promise<void> {
  const store = await cookies();
  // Payload tanpa facility_id sama sekali tidak boleh naik pangkat jadi global.
  if (facilityId === undefined) {
    store.delete(FACILITY_COOKIE);
    return;
  }
  store.set(FACILITY_COOKIE, facilityId === null ? GLOBAL_FACILITY : facilityId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

// undefined = cookie tidak ada (tidak diketahui); null = operator global.
export async function readFacilityId(): Promise<string | null | undefined> {
  const store = await cookies();
  const value = store.get(FACILITY_COOKIE)?.value;
  if (!value) return undefined;
  return value === GLOBAL_FACILITY ? null : value;
}

// Petunjuk UI saja: menampilkan aksi verifikasi/flag. Izin tetap diputuskan
// backend dari token. Cocok ke nilai eksplisit 'global' -- cookie hilang,
// kosong, atau tak dikenal = false. Hanya boolean ini yang boleh dioper ke
// komponen klien; role dan facility_id mentah ikut terserialisasi ke RSC.
export async function readCanManage(): Promise<boolean> {
  const store = await cookies();
  return (
    store.get(ROLE_COOKIE)?.value === 'admin' &&
    store.get(FACILITY_COOKIE)?.value === GLOBAL_FACILITY
  );
}

export async function clearToken(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(ROLE_COOKIE);
  store.delete(FACILITY_COOKIE);
}
