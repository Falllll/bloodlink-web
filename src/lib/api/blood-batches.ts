import type { ApiPaginated } from '@/lib/api/types';

export type BatchStatusValue =
  | 'quarantined' | 'testing' | 'released' | 'reserved'
  | 'issued' | 'discarded' | 'expired' | 'separated';

export type ComponentValue =
  | 'whole_blood' | 'packed_red_cells' | 'fresh_frozen_plasma'
  | 'platelet_concentrate' | 'cryoprecipitate';

export type BloodGroup = 'A' | 'B' | 'AB' | 'O';
export type RhFactor = 'positive' | 'negative';

export type BloodBatch = {
  id: string;
  batch_number: string;
  facility_id: string;
  donor_id: string | null;
  component: ComponentValue;
  blood_group: BloodGroup | null;
  rh_factor: RhFactor | null;
  volume_ml: number;
  status: BatchStatusValue;
  parent_id: string | null;
  collected_at: string;
  released_at: string | null;
  expires_at: string | null;
};

export type BloodBatchPage = ApiPaginated<BloodBatch>;

export type BloodBatchFilters = {
  status?: BatchStatusValue;
  component?: ComponentValue;
  bloodGroup?: BloodGroup;
  rhFactor?: RhFactor;
};

export const BATCH_STATUSES: readonly BatchStatusValue[] = [
  'quarantined', 'testing', 'released', 'reserved',
  'issued', 'discarded', 'expired', 'separated',
];
export const COMPONENTS: readonly ComponentValue[] = [
  'whole_blood', 'packed_red_cells', 'fresh_frozen_plasma',
  'platelet_concentrate', 'cryoprecipitate',
];
export const BLOOD_GROUPS: readonly BloodGroup[] = ['A', 'B', 'AB', 'O'];
export const RH_FACTORS: readonly RhFactor[] = ['positive', 'negative'];

export const BATCH_PER_PAGE = 25;

export function buildBloodBatchPath(filters: BloodBatchFilters, cursor: string | null): string {
  const params = new URLSearchParams();

  const entries: ReadonlyArray<[string, string | undefined]> = [
    ['filter[status]', filters.status],
    ['filter[component]', filters.component],
    ['filter[blood_group]', filters.bloodGroup],
    ['filter[rh_factor]', filters.rhFactor],
  ];

  for (const [name, value] of entries) {
    if (value) params.set(name, value);
  }

  params.set('per_page', String(BATCH_PER_PAGE));
  if (cursor !== null) params.set('cursor', cursor);

  return `/blood-batches?${params.toString()}`;
}
