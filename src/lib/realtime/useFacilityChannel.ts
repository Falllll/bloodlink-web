'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { getEcho, type EchoClient } from './echo';

export type FacilityChannelHandlers = {
  onDonorResponded?: (payload: { campaign_id: string; blood_request_id: string; response: 'accepted' | 'declined' }) => void;
  onRequestStatus?: (payload: { request_id: string; status: string }) => void;
  // Dua event percakapan sengaja tanpa isi pesan: pakai sebagai sinyal untuk refetch.
  onConversationEscalated?: () => void;
  onConversationMessagePosted?: (payload: { conversation_id: string; message_id: string; sender_kind: string }) => void;
};

export type FacilityChannelStatus = 'connecting' | 'live' | 'offline';

// Satu channel dipakai bersama beberapa komponen (panel dashboard, badge di layout,
// kotak masuk), sedangkan echo.leave() memutus semuanya. Channel baru ditinggalkan
// saat pemegang terakhirnya pergi.
const holders = new WeakMap<EchoClient, Map<string, number>>();

function acquire(echo: EchoClient, name: string) {
  const counts = holders.get(echo) ?? new Map<string, number>();
  holders.set(echo, counts);
  counts.set(name, (counts.get(name) ?? 0) + 1);
  return echo.private(name);
}

function release(echo: EchoClient, name: string): void {
  const counts = holders.get(echo);
  const remaining = (counts?.get(name) ?? 1) - 1;
  if (remaining > 0) {
    counts?.set(name, remaining);
    return;
  }
  counts?.delete(name);
  echo.leave(name);
}

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
    const channel = acquire(echo, name);

    const listeners: ReadonlyArray<[string, CallableFunction]> = [
      ['.campaign.donor-responded', (payload: Parameters<NonNullable<FacilityChannelHandlers['onDonorResponded']>>[0]) => {
        latest.current.onDonorResponded?.(payload);
      }],
      ['.blood-request.status', (payload: Parameters<NonNullable<FacilityChannelHandlers['onRequestStatus']>>[0]) => {
        latest.current.onRequestStatus?.(payload);
      }],
      ['.conversation.escalated', () => {
        latest.current.onConversationEscalated?.();
      }],
      ['.conversation.message-posted', (payload: Parameters<NonNullable<FacilityChannelHandlers['onConversationMessagePosted']>>[0]) => {
        latest.current.onConversationMessagePosted?.(payload);
      }],
    ];

    // Titik di depan wajib: broadcastAs() membuatnya nama kustom. Tanpa titik Echo
    // mencari nama kelas PHP ber-namespace dan gagal tanpa error apa pun.
    for (const [event, listener] of listeners) channel.listen(event, listener);

    return () => {
      for (const [event, listener] of listeners) channel.stopListening(event, listener);
      release(echo, name);
    };
  }, [facilityId]);
}

// Socket yang pernah putus tetap 'offline' selama Pusher bolak-balik mencoba
// menyambung; tanpa ini indikatornya berkedip di antara dua status.
const channelState = new Map<string, { wasDown: boolean; rejected: boolean }>();

function readStatus(name: string): FacilityChannelStatus {
  const echo = getEcho();
  const connection = echo.connector.pusher.connection.state;
  const subscription = echo.connector.channels[`private-${name}`]?.subscription;
  const state = channelState.get(name);

  // Socket tersambung belum berarti siaran sampai: channel yang ditolak otorisasinya
  // tidak menerima apa pun, jadi "live" juga mensyaratkan langganannya berhasil.
  if (connection === 'connected' && subscription?.subscribed) return 'live';
  if (state?.wasDown || state?.rejected) return 'offline';
  return connection === 'unavailable' || connection === 'failed' || connection === 'disconnected'
    ? 'offline'
    : 'connecting';
}

// Null = tidak ada channel yang dituju; pemanggil yang menentukan kalimatnya.
export function useFacilityChannelStatus(facilityId: string | null): FacilityChannelStatus {
  const name = facilityId === null ? null : `facility.${facilityId}`;

  const subscribe = useCallback(
    (notify: () => void) => {
      if (name === null) return () => {};

      const echo = getEcho();
      const channel = acquire(echo, name);
      const connection = echo.connector.pusher.connection;
      const state = channelState.get(name) ?? { wasDown: false, rejected: false };
      channelState.set(name, state);

      const onConnection = ({ current }: { current: string }) => {
        if (current === 'connected') state.wasDown = false;
        if (current === 'unavailable' || current === 'failed' || current === 'disconnected') state.wasDown = true;
        notify();
      };
      const onSubscribed = () => {
        state.rejected = false;
        notify();
      };
      const onRejected = () => {
        state.rejected = true;
        notify();
      };

      connection.bind('state_change', onConnection);
      channel.subscription.bind('pusher:subscription_succeeded', onSubscribed);
      channel.subscription.bind('pusher:subscription_error', onRejected);

      return () => {
        connection.unbind('state_change', onConnection);
        channel.subscription.unbind('pusher:subscription_succeeded', onSubscribed);
        channel.subscription.unbind('pusher:subscription_error', onRejected);
        release(echo, name);
      };
    },
    [name],
  );

  const getSnapshot = useCallback((): FacilityChannelStatus => (name === null ? 'offline' : readStatus(name)), [name]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 'connecting');
}
