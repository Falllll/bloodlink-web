'use client';

import { useEffect, useRef } from 'react';
import { getEcho } from './echo';

export type FacilityChannelHandlers = {
  onDonorResponded?: (payload: { campaign_id: string; blood_request_id: string; response: 'accepted' | 'declined' }) => void;
  onRequestStatus?: (payload: { request_id: string; status: string }) => void;
};

export function useFacilityChannel(facilityId: string | null, handlers: FacilityChannelHandlers): void {
  // Disimpan di ref supaya effect berlangganan tidak terulang setiap render.
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (facilityId === null) return;

    const name = `facility.${facilityId}`;
    const echo = getEcho();

    // Titik di depan wajib: broadcastAs() membuatnya nama kustom. Tanpa titik Echo
    // mencari nama kelas PHP ber-namespace dan gagal tanpa error apa pun.
    echo
      .private(name)
      .listen('.campaign.donor-responded', (payload: Parameters<NonNullable<FacilityChannelHandlers['onDonorResponded']>>[0]) => {
        latest.current.onDonorResponded?.(payload);
      })
      .listen('.blood-request.status', (payload: Parameters<NonNullable<FacilityChannelHandlers['onRequestStatus']>>[0]) => {
        latest.current.onRequestStatus?.(payload);
      });

    return () => {
      echo.leave(name);
    };
  }, [facilityId]);
}
