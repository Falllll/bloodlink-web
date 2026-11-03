import { apiFetch } from '@/lib/api/client';
import type { ChatMessage, ChatMessagePage, ChatMessageResult, ConversationResult, ConversationRow, EscalationReason } from '@/lib/api/conversations';
import type { ApiSuccess } from '@/lib/api/types';

// Rute pengunjung anonim (kartu 495). Beda dari /inbox/* milik petugas: tanpa login
// dan tanpa Idempotency-Key, identitasnya header X-Visitor-Token. Token itu hanya
// dikirim sekali dan hanya boleh hidup di memori pemanggil, tidak pernah di storage.

// Lebih pendek dari ini akan memutus backend yang sekadar lambat.
const REQUEST_TIMEOUT_MS = 20_000;

export type OpenedConversation = {
  conversation: ConversationRow;
  message: ChatMessage;
  visitor_token: string;
  visitor_expires_at: string;
};

function jsonPost(body: unknown, visitorToken?: string): RequestInit {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(visitorToken === undefined ? {} : { 'x-visitor-token': visitorToken }),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  };
}

function conversationPath(conversationId: string, action: 'messages' | 'escalate'): string {
  return `/conversations/${encodeURIComponent(conversationId)}/${action}`;
}

// Backend menulis pesan pertama di transaksi yang sama, jadi tidak perlu kirim terpisah.
export async function openVisitorConversation(message: string, facilityId: string): Promise<OpenedConversation> {
  const res = await apiFetch<ApiSuccess<OpenedConversation>>('/conversations', jsonPost({ message, facility_id: facilityId }));
  return res.data;
}

export function escalateVisitorConversation(
  conversationId: string,
  visitorToken: string,
  reason: EscalationReason,
  facilityId: string,
): Promise<ConversationResult> {
  return apiFetch<ConversationResult>(
    conversationPath(conversationId, 'escalate'),
    jsonPost({ reason, facility_id: facilityId }, visitorToken),
  );
}

export async function postVisitorMessage(conversationId: string, visitorToken: string, body: string): Promise<ChatMessage> {
  const res = await apiFetch<ChatMessageResult>(conversationPath(conversationId, 'messages'), jsonPost({ body }, visitorToken));
  return res.data;
}

export function getVisitorMessages(conversationId: string, visitorToken: string, cursor: string | null): Promise<ChatMessagePage> {
  const query = cursor === null ? '' : `?${new URLSearchParams({ cursor }).toString()}`;

  return apiFetch<ChatMessagePage>(`${conversationPath(conversationId, 'messages')}${query}`, {
    headers: { 'x-visitor-token': visitorToken },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}
