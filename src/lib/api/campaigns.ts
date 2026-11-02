import type { ApiSuccess } from '@/lib/api/types';

export type CampaignStage = {
  radius_meters: number;
  contacted: number;
  accepted: number;
  declined: number;
};

export type CampaignTotals = { contacted: number; accepted: number; declined: number };

export type DonorCampaign = {
  id: string;
  blood_request_id: string;
  current_radius_meters: number;
  started_at: string;
  stage_entered_at: string;
  ended_at: string | null;
  end_reason: string | null;
  stages: CampaignStage[];
  totals: CampaignTotals;
};

export type CampaignsResponse = ApiSuccess<DonorCampaign[]> & { meta: { scope: 'facility'; reason?: 'no_facility' } };

export const CAMPAIGNS_PATH = '/dashboard/campaigns';
