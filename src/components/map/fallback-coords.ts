import type { FacilityRow } from '@/lib/api/facilities';

// SEMENTARA, HARDCODE. Seeder dev backend (DevDataSeeder) belum memberi
// koordinat ke fasilitas, jadi /facilities membalas latitude/longitude null dan
// peta tidak bisa digambar. Sampai seeder-nya diperbaiki, fasilitas tanpa
// koordinat diletakkan di pusat KOTA-nya (perkiraan, bukan lokasi sungguhan).
//
// Koordinat dari API SELALU menang: begitu backend mengirim nilai, tabel ini
// tidak terpakai lagi dan file ini boleh dihapus.
const CITY_CENTER: Readonly<Record<string, readonly [number, number]>> = {
  jakarta: [-6.2088, 106.8456],
  bekasi: [-6.2383, 106.9756],
  tangerang: [-6.1783, 106.6319],
  bogor: [-6.595, 106.8166],
  depok: [-6.4025, 106.7942],
  jambi: [-1.6101, 103.6131],
};
const DEFAULT_CENTER = CITY_CENTER.jakarta;

// Beberapa fasilitas berbagi kota; tanpa geser, marker-nya bertumpuk jadi satu.
const SPREAD = 0.012;

export function withFallbackCoords(rows: FacilityRow[]): FacilityRow[] {
  const perCity = new Map<string, number>();

  return rows.map((row) => {
    if (row.latitude !== null && row.longitude !== null) return row;

    const city = row.city.trim().toLowerCase();
    const [lat, lng] = CITY_CENTER[city] ?? DEFAULT_CENTER;
    const nth = perCity.get(city) ?? 0;
    perCity.set(city, nth + 1);
    const angle = nth * 2.4; // sudut emas kasar: sebaran merata tanpa pola garis

    return {
      ...row,
      latitude: lat + (nth === 0 ? 0 : Math.sin(angle) * SPREAD * Math.sqrt(nth)),
      longitude: lng + (nth === 0 ? 0 : Math.cos(angle) * SPREAD * Math.sqrt(nth)),
    };
  });
}
