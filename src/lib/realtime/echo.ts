import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export type EchoClient = Echo<'reverb'>;

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

let instance: EchoClient | null = null;

/** Satu instance per tab. Dibuat saat panel realtime pertama mount, bukan saat app boot. */
export function getEcho(): EchoClient {
  if (instance !== null) return instance;

  window.Pusher = Pusher;

  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT);

  // Tanpa cluster: Reverb bukan Pusher Cloud, dan menambahkannya membuat klien
  // menyambung ke host yang salah.
  instance = new Echo({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: port,
    wssPort: port,
    forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
  });

  return instance;
}

export function disconnectEcho(): void {
  instance?.disconnect();
  instance = null;
}
