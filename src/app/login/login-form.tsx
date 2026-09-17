'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiFailure, apiFetch, newIdempotencyKey } from '@/lib/api/client';
import { messageFor } from '@/lib/api/error-message';
import { useApiMutation } from '@/lib/api/hooks';
import type { LoginResult } from '@/lib/api/types';
import { roleHome } from '@/lib/auth/roles';

const T = {
  title: 'Masuk',
  email: 'Email',
  password: 'Kata sandi',
  submit: 'Masuk',
  submitting: 'Memeriksa…',
} as const;

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const m = useApiMutation<{ data: LoginResult }, { email: string; password: string }>(
    (v) =>
      apiFetch<{ data: LoginResult }>('/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': newIdempotencyKey(),
        },
        body: JSON.stringify(v),
      }),
    {
      redirectOnUnauthenticated: false,
      onSuccess: (d) => router.replace(roleHome(d.data.user.role)),
    },
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    m.mutate({ email, password });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm text-[color:var(--color-ink-soft)]">
          {T.email}
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm text-[color:var(--color-ink-soft)]">
          {T.password}
        </label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={m.isPending}>
        {m.isPending ? T.submitting : T.submit}
      </Button>
      {m.error instanceof ApiFailure && (
        <p role="alert" className="text-sm text-destructive">
          {messageFor(m.error.body.error.code)}
        </p>
      )}
    </form>
  );
}
