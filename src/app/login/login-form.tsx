'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiFailure, apiFetch, newIdempotencyKey } from '@/lib/api/client';
import { useApiMutation } from '@/lib/api/hooks';
import type { LoginResult } from '@/lib/api/types';
import { roleHome } from '@/lib/auth/roles';
import { translateApiError } from '@/lib/errors/translate-api-error';

export function LoginForm() {
  const t = useTranslations();
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

  const err = m.error instanceof ApiFailure ? translateApiError(m.error.body, t) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm text-[color:var(--color-ink-soft)]">
          {t('login.email')}
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {err?.fields.email?.map((message) => (
          <p key={message} className="text-sm text-destructive">
            {message}
          </p>
        ))}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm text-[color:var(--color-ink-soft)]">
          {t('login.password')}
        </label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err?.fields.password?.map((message) => (
          <p key={message} className="text-sm text-destructive">
            {message}
          </p>
        ))}
      </div>
      <Button type="submit" className="w-full" disabled={m.isPending}>
        {m.isPending ? t('login.submitting') : t('login.submit')}
      </Button>
      {err && (
        <p role="alert" className="text-sm text-destructive">
          {err.summary}
        </p>
      )}
    </form>
  );
}
