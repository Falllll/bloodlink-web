'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ApiFailure } from '@/lib/api/client';
import { CHAT_MESSAGE_MAX, type ChatMessage, type EscalationReason } from '@/lib/api/conversations';
import {
  escalateVisitorConversation,
  getVisitorMessages,
  openVisitorConversation,
  postVisitorMessage,
} from '@/lib/api/conversations-public';
import { translateApiError } from '@/lib/errors/translate-api-error';
import { ChatLauncher } from './chat-launcher';

type Audience = 'donor' | 'requester';
type Ended = 'expired' | 'closed';

const AUDIENCES: readonly Audience[] = ['donor', 'requester'];
const REASON: Record<Audience, EscalationReason> = {
  donor: 'personal_medical_question',
  requester: 'other',
};
const POLL_MS = 30_000;
// Rem per siklus: kursor bisa maju beberapa halaman, tapi tidak boleh jadi loop.
const POLL_MAX_PAGES = 5;
const SELF_CHECK_HREF = '#cek-kelayakan';

const NOTE = 'text-sm text-[color:var(--color-ink-muted)]';
const STATUS = 'rounded-lg border border-border px-3 py-2 text-xs text-[color:var(--color-ink-soft)]';

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);

  return [...byId.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

// Backend memakai CONVERSATION_REJECTED untuk dua keadaan: 422 = token kedaluwarsa,
// 409 = percakapan menolak aksinya (sudah dieskalasi atau sudah ditutup). Kodenya sama,
// jadi statusnya yang membedakan.
function isTokenRejected(error: unknown): boolean {
  return error instanceof ApiFailure && error.status === 422 && error.body.error.code === 'CONVERSATION_REJECTED';
}

function isConflict(error: unknown): boolean {
  return error instanceof ApiFailure && error.status === 409;
}

export function ChatWidget({ facilityId }: { facilityId: string }) {
  // Tanpa namespace: translateApiError memanggil t.has('errors.*') dari akar.
  const t = useTranslations();
  const id = useId();

  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [ended, setEnded] = useState<Ended | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);

  // Hanya di memori: refresh menghapusnya, dan itu disengaja (lihat chat.refreshNotice).
  const visitorToken = useRef<string | null>(null);
  // Kursor halaman terakhir: membaca ulang dari sini mengambil pesan baru tanpa
  // menarik seluruh riwayat, karena halaman pesan urut tulis (terlama lebih dulu).
  const lastPageCursor = useRef<string | null>(null);
  const checkInFlight = useRef(false);

  function describe(error: unknown): string {
    if (error instanceof ApiFailure) {
      const translated = translateApiError(error.body, t);
      return Object.values(translated.fields)[0]?.[0] ?? translated.summary;
    }
    return error instanceof DOMException && error.name === 'TimeoutError' ? t('chat.timeout') : t('chat.network');
  }

  const checkReplies = useCallback(async () => {
    const token = visitorToken.current;
    if (conversationId === null || token === null || checkInFlight.current) return;

    checkInFlight.current = true;
    setChecking(true);
    try {
      for (let page = 0; page < POLL_MAX_PAGES; page++) {
        const res = await getVisitorMessages(conversationId, token, lastPageCursor.current);
        setMessages((current) => mergeMessages(current, res.data));

        const next = res.meta.has_more ? res.meta.next_cursor : null;
        if (next === null || next === lastPageCursor.current) break;
        lastPageCursor.current = next;
      }
      setCheckFailed(false);
    } catch (error) {
      if (isTokenRejected(error)) {
        setEnded('expired');
      } else {
        setCheckFailed(true);
      }
    } finally {
      checkInFlight.current = false;
      setChecking(false);
    }
  }, [conversationId]);

  // Berhenti total saat widget ditutup; selagi terbuka hanya jalan kalau tab terlihat.
  useEffect(() => {
    if (!open || conversationId === null || ended !== null) return;

    const tick = () => {
      if (document.visibilityState === 'visible') void checkReplies();
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => clearInterval(timer);
  }, [open, conversationId, ended, checkReplies]);

  function startOver() {
    visitorToken.current = null;
    lastPageCursor.current = null;
    setAudience(null);
    setConversationId(null);
    setMessages([]);
    setDraft('');
    setEscalated(false);
    setEnded(null);
    setUnavailable(false);
    setSendError(null);
    setCheckFailed(false);
  }

  async function escalate(conversation: string, token: string, who: Audience) {
    try {
      await escalateVisitorConversation(conversation, token, REASON[who], facilityId);
      setEscalated(true);
      setSendError(null);
    } catch (error) {
      if (isTokenRejected(error)) {
        setEnded('expired');
      } else if (isConflict(error)) {
        // Percobaan sebelumnya ternyata sudah sampai: eskalasi hanya sekali jalan.
        setEscalated(true);
        setSendError(null);
      } else {
        setSendError(t('chat.forwardFailed'));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || audience === null || draft.trim() === '') return;

    setBusy(true);
    setSendError(null);

    try {
      if (conversationId === null) {
        const opened = await openVisitorConversation(draft, facilityId);
        visitorToken.current = opened.visitor_token;
        setConversationId(opened.conversation.id);
        setMessages([opened.message]);
        setDraft('');
        await escalate(opened.conversation.id, opened.visitor_token, audience);
      } else if (visitorToken.current !== null) {
        const message = await postVisitorMessage(conversationId, visitorToken.current, draft);
        setMessages((current) => mergeMessages(current, [message]));
        setDraft('');
      }
    } catch (error) {
      if (isTokenRejected(error)) {
        setEnded('expired');
      } else if (isConflict(error)) {
        setEnded('closed');
      } else if (conversationId === null && !(error instanceof ApiFailure && error.body.error.code === 'VALIDATION_FAILED')) {
        // Belum ada percakapan dan backend tidak menerimanya: jalan keluarnya self-check.
        setUnavailable(true);
      } else {
        setSendError(describe(error));
      }
    } finally {
      setBusy(false);
    }
  }

  async function retryForward() {
    if (busy || conversationId === null || visitorToken.current === null || audience === null) return;
    setBusy(true);
    await escalate(conversationId, visitorToken.current, audience);
    setBusy(false);
  }

  if (!open) return <ChatLauncher onOpen={() => setOpen(true)} />;

  const selfCheckOffer = (
    <Button asChild variant="outline" size="sm" className="self-start">
      <a href={SELF_CHECK_HREF} onClick={() => setOpen(false)}>
        {t('chat.openSelfCheck')}
      </a>
    </Button>
  );

  let content: React.ReactNode;

  if (!acknowledged) {
    content = (
      <div className="flex flex-col gap-3">
        {/* Teks medis: hanya id dan en yang direview manusia, locale lain memakai versi Inggris. */}
        <p className="text-sm text-[color:var(--color-ink)]">{t('medical.chat.disclaimer')}</p>
        <p className={NOTE}>{t('chat.refreshNotice')}</p>
        <Button type="button" className="self-start" onClick={() => setAcknowledged(true)}>
          {t('chat.acknowledge')}
        </Button>
      </div>
    );
  } else if (unavailable) {
    content = (
      <div role="alert" className="flex flex-col gap-3">
        <p className="text-sm text-[color:var(--color-ink)]">{t('chat.unavailable')}</p>
        {selfCheckOffer}
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={startOver}>
          {t('chat.startOver')}
        </Button>
      </div>
    );
  } else if (audience === null) {
    content = (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-[color:var(--color-ink-strong)]">{t('chat.audienceQuestion')}</p>
        {AUDIENCES.map((value) => (
          <Button key={value} type="button" variant="outline" className="justify-start" onClick={() => setAudience(value)}>
            {t(`chat.audience.${value}`)}
          </Button>
        ))}
      </div>
    );
  } else {
    content = (
      <div className="flex min-h-0 flex-col gap-3">
        {conversationId === null && <p className={NOTE}>{t(`chat.opening.${audience}`)}</p>}

        {messages.length > 0 && (
          <ol aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {messages.map((message) => (
              <li key={message.id} className={message.sender_kind === 'visitor' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  data-sender={message.sender_kind}
                  className={`max-w-[85%] rounded-xl border border-border px-3 py-2 text-sm text-[color:var(--color-ink)] ${
                    message.sender_kind === 'visitor' ? 'bg-[color:var(--color-ink-muted)]/10' : ''
                  }`}
                >
                  <p className="mb-1 text-xs font-medium text-[color:var(--color-ink-muted)]">
                    {t(`chat.sender.${message.sender_kind}`)}
                  </p>
                  {message.body === null ? (
                    <p className="italic text-[color:var(--color-ink-muted)]">{t('chat.bodyPurged')}</p>
                  ) : (
                    <p className="break-words whitespace-pre-wrap">{message.body}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* Sengaja tanpa indikator mengetik: tidak ada sinyal bahwa seseorang sedang menjawab. */}
        {escalated && ended === null && <p role="status" className={STATUS}>{t('chat.forwarded')}</p>}

        {ended !== null ? (
          <div role="alert" className="flex flex-col gap-3">
            <p className="text-sm text-[color:var(--color-ink)]">{t(`chat.${ended}`)}</p>
            <Button type="button" className="self-start" onClick={startOver}>
              {t('chat.startOver')}
            </Button>
          </div>
        ) : (
          <>
            {sendError !== null && (
              <p role="alert" className="text-sm text-destructive">
                {sendError}
              </p>
            )}
            {conversationId !== null && !escalated ? (
              <Button type="button" className="self-start" disabled={busy} onClick={() => void retryForward()}>
                {t('chat.retryForward')}
              </Button>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-2">
                <label htmlFor={`${id}-message`} className="sr-only">
                  {t('chat.placeholder')}
                </label>
                <textarea
                  id={`${id}-message`}
                  value={draft}
                  maxLength={CHAT_MESSAGE_MAX}
                  placeholder={t('chat.placeholder')}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {conversationId === null ? (
                    <span />
                  ) : (
                    <Button type="button" variant="outline" size="sm" disabled={checking} onClick={() => void checkReplies()}>
                      {checking ? t('chat.checking') : t('chat.checkReplies')}
                    </Button>
                  )}
                  <Button type="submit" disabled={busy || draft.trim() === ''}>
                    {busy ? t('chat.sending') : t('chat.send')}
                  </Button>
                </div>
                {checkFailed && <p role="status" className="text-xs text-[color:var(--color-ink-soft)]">{t('chat.checkFailed')}</p>}
              </form>
            )}
          </>
        )}
      </div>
    );
  }

  // Latar padat, bukan glass: panel ini melayang di atas halaman yang di-scroll dan
  // sudah memakai anggaran blur-nya sendiri.
  return (
    <section
      role="dialog"
      aria-label={t('chat.title')}
      className="fixed right-4 bottom-4 z-50 flex max-h-[min(36rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] flex-col gap-3 rounded-2xl border border-border bg-[color:var(--color-base)] p-4 shadow-lg sm:w-96"
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-[color:var(--color-ink-strong)]">{t('chat.title')}</h2>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={t('chat.close')} onClick={() => setOpen(false)}>
          <X aria-hidden="true" />
        </Button>
      </header>
      {content}
    </section>
  );
}
