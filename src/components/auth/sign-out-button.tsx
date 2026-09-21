'use client';

import { Button } from '@/components/ui/button';
import { newIdempotencyKey } from '@/lib/api/client';

export function SignOutButton() {
  async function onClick() {
    await fetch('/bff/auth/logout', {
      method: 'POST',
      headers: { 'Idempotency-Key': newIdempotencyKey() },
    });
    window.location.replace('/login');
  }

  return (
    <Button variant="outline" onClick={onClick}>
      Keluar
    </Button>
  );
}
