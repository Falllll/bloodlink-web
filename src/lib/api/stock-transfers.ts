import type { ApiPaginated } from '@/lib/api/types';

export type StockTransferStatus =
  | 'requested' | 'approved' | 'rejected' | 'shipped' | 'received' | 'cancelled';

// Field persis dari skema StockTransfer di openapi.yaml (kartu 300). Unit tetap
// milik fasilitas asal selama transfer terbuka.
export type StockTransfer = {
  id: string;
  unit_id: string;
  from_facility_id: string;
  to_facility_id: string;
  status: StockTransferStatus;
  reason: string | null;
  decision_note: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  shipped_at: string | null;
  received_at: string | null;
  cancelled_at: string | null;
};

export type StockTransferPage = ApiPaginated<StockTransfer>;

// "Masih berjalan" = transfer terbuka menurut backend: satu unit paling banyak
// punya satu transfer berstatus salah satu dari ketiganya.
export const OPEN_TRANSFER_STATUSES: readonly StockTransferStatus[] = ['requested', 'approved', 'shipped'];

// Batas atas per_page di backend (AppliesListQuery). filter[status] hanya satu
// nilai, jadi transfer terbuka = satu query per status lalu digabung.
export const TRANSFER_PER_PAGE = 100;

export function buildOpenTransferPath(status: StockTransferStatus): string {
  const params = new URLSearchParams();

  params.set('filter[status]', status);
  params.set('per_page', String(TRANSFER_PER_PAGE));
  params.set('sort', '-created_at');

  return `/stock-transfers?${params.toString()}`;
}

// Transfer bisa berganti status di antara dua query lalu muncul dua kali;
// yang terakhir dilihat menang.
export function mergeTransfers(pages: ReadonlyArray<ReadonlyArray<StockTransfer>>): StockTransfer[] {
  const byId = new Map<string, StockTransfer>();
  for (const page of pages) for (const transfer of page) byId.set(transfer.id, transfer);

  return [...byId.values()];
}
