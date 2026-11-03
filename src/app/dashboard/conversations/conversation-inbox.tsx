'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { StatusChip, type ChipTone } from '@/components/ui/status-chip';
import { ApiFailure, apiFetch } from '@/lib/api/client';
import {
  CHAT_MESSAGE_MAX,
  assignConversationInit,
  buildConversationMessagesPath,
  buildConversationsPath,
  closeConversationInit,
  postStaffMessageInit,
  type ChatMessage,
  type ChatMessageResult,
  type ConversationPage,
  type ConversationResult,
  type ConversationRow,
  type ConversationStatus,
} from '@/lib/api/conversations';
import { useApiCursorPages, useApiMutation, useApiQuery } from '@/lib/api/hooks';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { useFacilityChannel, useFacilityChannelStatus } from '@/lib/realtime/useFacilityChannel';

const INBOX_PATH = '/dashboard/conversations';
const CONVERSATIONS_KEY = ['conversations'] as const;
const LIST_KEY = [...CONVERSATIONS_KEY, 'list'] as const;
const messagesKey = (conversationId: string) => [...CONVERSATIONS_KEY, 'messages', conversationId] as const;
const MESSAGE_MAX_PAGES = 10;
const STATUS_FILTERS: readonly ConversationStatus[] = ['escalated', 'assigned', 'closed'];
const STATUS_TONE: Record<ConversationStatus, ChipTone> = {
  open: 'neutral',
  escalated: 'warning',
  assigned: 'positive',
  closed: 'neutral',
};

const NOTE = 'py-8 text-center text-sm text-[color:var(--color-ink-muted)]';
const ALERT = 'py-8 text-center text-sm text-[color:var(--color-ink-soft)]';
const SUB = 'text-xs text-[color:var(--color-ink-muted)]';
const LABEL = 'text-xs font-medium text-[color:var(--color-ink-muted)]';
const SELECT =
  'h-8 rounded-lg border border-input bg-[color:var(--color-base)] px-2.5 text-sm text-[color:var(--color-ink)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';
const TEXTAREA =
  'min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

type Translator = ReturnType<typeof useTranslations>;
type Request = [string, RequestInit];

// Dipasang di layout, jadi selalu hidup selagi kotak masuk terbuka: inilah satu-
// satunya pelanggan event percakapan. Payload hanya sinyal; isinya dari refetch.
export function ConversationsNavLink({ facilityId, className }: { facilityId: string | null; className: string }) {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const { data } = useApiQuery<ConversationPage>([...LIST_KEY, 'badge'], buildConversationsPath('escalated', null));

  useFacilityChannel(facilityId, {
    onConversationEscalated: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
    onConversationMessagePosted: ({ conversation_id }) => {
      void queryClient.invalidateQueries({ queryKey: LIST_KEY });
      void queryClient.invalidateQueries({ queryKey: messagesKey(conversation_id) });
    },
  });

  // Siaran selama putus tidak diputar ulang, jadi setelah tersambung lagi datanya
  // dibaca ulang supaya tidak diam-diam tertinggal.
  const status = useFacilityChannelStatus(facilityId);
  const previous = useRef(status);
  useEffect(() => {
    if (previous.current === 'offline' && status === 'live') {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    }
    previous.current = status;
  }, [status, queryClient]);

  const waiting = data?.data.filter((row) => row.status === 'escalated' && row.assigned_user_id === null).length ?? 0;
  // Paginasi kursor tidak mengirim total: lebih dari satu halaman ditulis "N+".
  const count = data?.meta.has_more ? t('conversations.badgeMore', { count: waiting }) : String(waiting);

  return (
    <span className="inline-flex items-center gap-1.5">
      <Link href={INBOX_PATH} className={className}>
        {t('shell.navConversations')}
      </Link>
      {waiting > 0 && (
        <span aria-label={t('conversations.badgeLabel', { count })}>
          <StatusChip tone="warning" label={count} />
        </span>
      )}
    </span>
  );
}

function RealtimeNotice({ facilityId, globalScope }: { facilityId: string | null; globalScope: boolean }) {
  const t = useTranslations('conversations.realtime');
  const status = useFacilityChannelStatus(facilityId);

  // Lingkup global tidak punya channel: bukan gangguan, jadi bukan pesan error.
  if (globalScope) return <p className={SUB}>{t('globalScope')}</p>;

  if (facilityId !== null && status === 'live') return <p className={SUB}>{t('live')}</p>;
  if (facilityId !== null && status === 'connecting') return <p className={SUB}>{t('connecting')}</p>;

  return (
    <p role="status" className="text-xs font-medium text-[color:var(--color-status-testing)]">
      {t('offline')}
    </p>
  );
}

// Umur diperbarui sendiri agar rasa mendesaknya tetap benar di layar yang menganggur.
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function relativeAge(iso: string, now: number, locale: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { style: 'short', numeric: 'always' });
  // Jam "now" bisa sedikit tertinggal dari pesan terbaru: jangan sampai ke masa depan.
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));

  if (minutes < 60) return format.format(-minutes, 'minute');
  if (minutes < 1440) return format.format(-Math.floor(minutes / 60), 'hour');
  return format.format(-Math.floor(minutes / 1440), 'day');
}

function ConversationChips({ row, t }: { row: ConversationRow; t: Translator }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {row.escalation_reason !== null && (
        <StatusChip tone="warning" label={t(`conversations.reason.${row.escalation_reason}`)} />
      )}
      <StatusChip tone={STATUS_TONE[row.status]} label={t(`conversations.status.${row.status}`)} />
    </span>
  );
}

function MessageBubble({ message, now, locale, t }: { message: ChatMessage; now: number; locale: string; t: Translator }) {
  const fromStaff = message.sender_kind === 'staff';

  return (
    <li className={fromStaff ? 'flex justify-end' : 'flex justify-start'}>
      <div
        data-sender={message.sender_kind}
        className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm text-[color:var(--color-ink)] ${
          message.sender_kind === 'ai' ? 'border-dashed border-border' : 'border-border'
        } ${fromStaff ? 'bg-[color:var(--color-ink-muted)]/10' : ''}`}
      >
        <p className={`${SUB} mb-1 flex flex-wrap gap-2`}>
          <span className="font-medium">{t(`conversations.sender.${message.sender_kind}`)}</span>
          <time dateTime={message.created_at}>{relativeAge(message.created_at, now, locale)}</time>
        </p>
        {message.body === null ? (
          <p className="italic text-[color:var(--color-ink-muted)]">{t('conversations.panel.bodyPurged')}</p>
        ) : (
          <p className="break-words whitespace-pre-wrap">{message.body}</p>
        )}
      </div>
    </li>
  );
}

function ReplyForm({ conversationId, onDone }: { conversationId: string; onDone: () => void }) {
  const t = useTranslations();
  const id = useId();
  const inFlight = useRef(false);
  // Satu aksi pengguna = satu Idempotency-Key; payload berubah = aksi baru.
  const attempt = useRef<{ payload: string; request: Request } | null>(null);
  const [body, setBody] = useState('');

  const m = useApiMutation<ChatMessageResult, Request>(
    ([path, init]) => apiFetch<ChatMessageResult>(path, init),
    {
      onSuccess: () => {
        attempt.current = null;
        setBody('');
        onDone();
      },
    },
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;

    const payload = JSON.stringify({ conversationId, body });
    if (attempt.current === null || attempt.current.payload !== payload) {
      attempt.current = { payload, request: postStaffMessageInit(conversationId, body) };
    }

    m.mutate(attempt.current.request, { onSettled: () => { inFlight.current = false; } });
  }

  const err = m.error instanceof ApiFailure ? translateApiError(m.error.body, t) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-2">
      <label htmlFor={`${id}-body`} className={LABEL}>
        {t('conversations.panel.replyLabel')}
      </label>
      <textarea
        id={`${id}-body`}
        value={body}
        maxLength={CHAT_MESSAGE_MAX}
        onChange={(e) => setBody(e.target.value)}
        className={TEXTAREA}
      />
      {err !== null && (
        <p role="alert" className="text-sm text-destructive">
          {err.fields.body?.[0] ?? err.summary}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={m.isPending}>
          {m.isPending ? t('conversations.panel.sending') : t('conversations.panel.send')}
        </Button>
      </div>
    </form>
  );
}

function ConversationAction({
  label,
  init,
  variant,
  onDone,
}: {
  label: string;
  init: () => Request;
  variant: 'default' | 'outline';
  onDone: (row: ConversationRow) => void;
}) {
  const t = useTranslations();
  const inFlight = useRef(false);
  // Satu aksi pengguna = satu Idempotency-Key, dipakai ulang di setiap percobaan.
  const attempt = useRef<Request | null>(null);

  const m = useApiMutation<ConversationResult, Request>(
    ([path, requestInit]) => apiFetch<ConversationResult>(path, requestInit),
    {
      onSuccess: (result) => {
        attempt.current = null;
        onDone(result.data);
      },
    },
  );

  function handleClick() {
    if (inFlight.current) return;
    inFlight.current = true;
    attempt.current ??= init();
    m.mutate(attempt.current, { onSettled: () => { inFlight.current = false; } });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button type="button" size="sm" variant={variant} disabled={m.isPending} onClick={handleClick}>
        {label}
      </Button>
      {m.error instanceof ApiFailure && (
        <span role="alert" className="text-xs text-destructive">
          {translateApiError(m.error.body, t).summary}
        </span>
      )}
    </span>
  );
}

function ConversationPanel({
  conversationId,
  row,
  currentUserId,
  now,
  onChanged,
  onBack,
}: {
  conversationId: string;
  row: ConversationRow | null;
  currentUserId: string | null;
  now: number;
  onChanged: (row: ConversationRow) => void;
  onBack: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const { data, isPending, isError, error } = useApiCursorPages<ChatMessage>(
    messagesKey(conversationId),
    (cursor) => buildConversationMessagesPath(conversationId, cursor),
    MESSAGE_MAX_PAGES,
  );

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
  }

  if (isPending) return <p className={NOTE}>{t('conversations.panel.loading')}</p>;

  if (isError) {
    const code = error.body.error.code;
    const message =
      code === 'FORBIDDEN'
        ? t('conversations.panel.forbidden')
        : code === 'NOT_FOUND'
          ? t('conversations.panel.notFound')
          : translateApiError(error.body, t).summary;

    return (
      <div className="py-8 text-center">
        <p role="alert" className="text-sm text-[color:var(--color-ink-soft)]">
          {message}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onBack}>
          {t('conversations.panel.back')}
        </Button>
      </div>
    );
  }

  const escalatedAt = row?.escalated_at ? Date.parse(row.escalated_at) : null;
  // Pembatas di pesan pertama sesudah eskalasi; tanpa pesan sesudahnya, di ujung riwayat.
  const firstAfter = escalatedAt === null ? -1 : data.items.findIndex((m) => Date.parse(m.created_at) >= escalatedAt);
  const dividerAt = escalatedAt === null ? -1 : firstAfter === -1 ? data.items.length : firstAfter;
  const divider = (
    <li role="separator" className="flex items-center gap-3 text-xs font-medium text-[color:var(--color-ink-muted)]">
      <span className="h-px flex-1 bg-border" />
      {t('conversations.panel.divider')}
      <span className="h-px flex-1 bg-border" />
    </li>
  );

  const holdsConversation = row?.status === 'assigned' && row.assigned_user_id === currentUserId;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold text-[color:var(--color-ink-strong)]">
            {t('conversations.anonymousVisitor')}
          </h2>
          {row !== null && <ConversationChips row={row} t={t} />}
        </div>
        {row !== null && (
          <div className="flex items-start gap-2" key={`${row.id}-${row.status}`}>
            {row.status === 'escalated' && (
              <ConversationAction
                label={t('conversations.panel.assign')}
                variant="default"
                init={() => assignConversationInit(row.id)}
                onDone={(next) => { onChanged(next); refresh(); }}
              />
            )}
            {(row.status === 'escalated' || row.status === 'assigned') && (
              <ConversationAction
                label={t('conversations.panel.close')}
                variant="outline"
                init={() => closeConversationInit(row.id)}
                onDone={(next) => { onChanged(next); refresh(); }}
              />
            )}
          </div>
        )}
      </div>

      {row === null && <p className={`${SUB} mt-2`}>{t('conversations.panel.rowUnavailable')}</p>}

      {/* Riwayat sebelum eskalasi selalu dirender utuh: mengambil alih tidak mengubahnya. */}
      <ol aria-live="polite" className="mt-4 flex max-h-[32rem] flex-col gap-3 overflow-y-auto">
        {data.items.map((message, index) => (
          <Fragment key={message.id}>
            {index === dividerAt && divider}
            <MessageBubble message={message} now={now} locale={locale} t={t} />
          </Fragment>
        ))}
        {dividerAt === data.items.length && divider}
      </ol>
      {data.truncated && <p className={`${SUB} mt-2`}>{t('conversations.panel.truncated')}</p>}

      {holdsConversation && <ReplyForm conversationId={conversationId} onDone={refresh} />}
      {row?.status === 'assigned' && !holdsConversation && (
        <p className={`${SUB} mt-4`}>{t('conversations.panel.heldByOther')}</p>
      )}
      {row?.status === 'escalated' && <p className={`${SUB} mt-4`}>{t('conversations.panel.assignFirst')}</p>}
      {row?.status === 'closed' && <p className={`${SUB} mt-4`}>{t('conversations.panel.closed')}</p>}
    </div>
  );
}

export function ConversationInbox({
  canView,
  globalScope,
  facilityId,
  currentUserId,
  conversationId,
}: {
  canView: boolean;
  globalScope: boolean;
  facilityId: string | null;
  currentUserId: string | null;
  conversationId: string | null;
}) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const locale = useLocale();
  const id = useId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const now = useNow();

  const [status, setStatus] = useState<ConversationStatus | ''>('');
  const [cursor, setCursor] = useState<string | null>(null);
  // Tidak ada endpoint detail: baris terakhir yang diketahui menjaga panel tetap
  // lengkap saat percakapannya keluar dari filter aktif sesudah diambil alih.
  const [known, setKnown] = useState<ConversationRow | null>(null);

  const { data, isPending, isError, error, isFetching, refetch } = useApiQuery<ConversationPage>(
    [...LIST_KEY, status, cursor],
    buildConversationsPath(status, cursor),
    { enabled: canView },
  );

  // Lingkup global tidak punya siaran, jadi membaca ulang saat halaman kembali
  // difokuskan menggantikannya. Bukan polling: tidak ada yang berjalan di latar.
  useEffect(() => {
    if (!globalScope) return;
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [globalScope, queryClient]);

  if (!canView) {
    return (
      <GlassPanel className="mt-6 p-6">
        <p role="alert" className={ALERT}>{t('errors.FORBIDDEN')}</p>
      </GlassPanel>
    );
  }

  // Hasil aksi sudah pasti dari backend: langsung dipakai supaya tombol dan badge tidak
  // menunggu refetch, yang selama itu masih menawarkan aksi yang sudah dijalankan.
  function applyChange(next: ConversationRow) {
    setKnown(next);
    queryClient.setQueriesData<ConversationPage>({ queryKey: LIST_KEY }, (page) =>
      page === undefined ? page : { ...page, data: page.data.map((row) => (row.id === next.id ? next : row)) },
    );
  }

  function open(row: ConversationRow) {
    setKnown(row);
    router.push(`${INBOX_PATH}?conversation=${encodeURIComponent(row.id)}`, { scroll: false });
  }

  function back() {
    router.push(INBOX_PATH, { scroll: false });
  }

  const selectedRow =
    conversationId === null
      ? null
      : (data?.data.find((row) => row.id === conversationId) ?? (known?.id === conversationId ? known : null));
  const prevCursor = data?.meta.prev_cursor ?? null;
  const nextCursor = data?.meta.has_more ? (data.meta.next_cursor ?? null) : null;

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <GlassPanel className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-status`} className={LABEL}>
              {t('conversations.filterStatus')}
            </label>
            <select
              id={`${id}-status`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ConversationStatus | '');
                // Cursor buram milik filter lama; wajib direset.
                setCursor(null);
              }}
              className={SELECT}
            >
              <option value="">{t('conversations.filterAll')}</option>
              {STATUS_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {t(`conversations.status.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
            {t('conversations.refresh')}
          </Button>
        </div>

        <div className="mt-3">
          <RealtimeNotice facilityId={facilityId} globalScope={globalScope} />
        </div>

        <div className="mt-4">
          {isPending ? (
            <p className={NOTE}>{t('conversations.loading')}</p>
          ) : isError ? (
            <p role="alert" className={ALERT}>{translateApiError(error.body, t).summary}</p>
          ) : data.data.length === 0 ? (
            <p className={NOTE}>{t('conversations.empty')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.data.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    aria-current={row.id === conversationId ? 'true' : undefined}
                    onClick={() => open(row)}
                    className={`flex w-full flex-col gap-2 rounded-lg px-2 py-3 text-left outline-none hover:bg-[color:var(--color-ink-muted)]/10 focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      row.id === conversationId ? 'bg-[color:var(--color-ink-muted)]/10' : ''
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-[color:var(--color-ink-strong)]">
                        {t('conversations.anonymousVisitor')}
                      </span>
                      <time dateTime={row.escalated_at ?? row.created_at} className={SUB}>
                        {relativeAge(row.escalated_at ?? row.created_at, now, locale)}
                      </time>
                    </span>
                    <ConversationChips row={row} t={t} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {(prevCursor !== null || nextCursor !== null) && (
          <div className="mt-4 flex justify-between gap-2">
            <Button type="button" variant="outline" size="sm" disabled={prevCursor === null} onClick={() => setCursor(prevCursor)}>
              {t('conversations.prev')}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={nextCursor === null} onClick={() => setCursor(nextCursor)}>
              {t('conversations.next')}
            </Button>
          </div>
        )}
      </GlassPanel>

      <GlassPanel className="p-6">
        {conversationId === null ? (
          <p className={NOTE}>{t('conversations.panel.nothingSelected')}</p>
        ) : (
          <ConversationPanel
            key={conversationId}
            conversationId={conversationId}
            row={selectedRow}
            currentUserId={currentUserId}
            now={now}
            onChanged={applyChange}
            onBack={back}
          />
        )}
      </GlassPanel>
    </div>
  );
}
