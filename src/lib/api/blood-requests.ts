import type { BloodGroup, ComponentValue, RhFactor } from '@/lib/api/blood-batches';

export type Urgency = 'urgent' | 'emergency';

export type BloodRequestStatus =
  | 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired';

export type BloodRequest = {
  id: string;
  facility_id: string;
  patient_reference: string;
  component: ComponentValue;
  blood_group: BloodGroup;
  rh_factor: RhFactor;
  quantity: number;
  // Respons umum boleh routine; endpoint urgent sendiri hanya menerima Urgency.
  urgency: 'routine' | Urgency;
  status: BloodRequestStatus;
  needed_by: string;
  note: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
};

export type UrgentRequestPayload = {
  patient_reference: string;   // wajib, maxLength 64
  component: ComponentValue;   // wajib
  blood_group: BloodGroup;     // wajib
  rh_factor: RhFactor;         // wajib
  quantity: number;            // wajib, 1..20
  urgency: Urgency;            // wajib, HANYA urgent | emergency (routine ditolak 422)
  needed_by: string;           // wajib, date-time ISO
  note?: string | null;        // opsional, maxLength 1000
};

export type NearbyStockStatus = 'scanned' | 'no_requester_location' | 'no_sourced_rule';

export type NearbyStockEntry = {
  facility_id: string;
  facility_name: string;
  distance_meters: number;   // METER, bukan km
  compatible_units: number;
  is_self: boolean;
};

export type UrgentRequestResult = {
  data: {
    request: BloodRequest;
    nearby_stock_status: NearbyStockStatus;
    nearby_stock: NearbyStockEntry[];
  };
  meta: Record<string, unknown>;
};

export const URGENCIES: readonly Urgency[] = ['urgent', 'emergency'];

export const URGENT_REQUEST_PATH = '/blood-requests/urgent';
