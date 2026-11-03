import type { ApiPaginated, ApiSuccess } from '@/lib/api/types';
import { newIdempotencyKey } from '@/lib/api/client';

export type ConversationStatus = 'open' | 'escalated' | 'assigned' | 'closed';
export type EscalationReason = 'personal_medical_question' | 'lab_result_question' | 'complaint' | 'other';
// `ai` belum muncul di data nyata selama jalur AI dicoret dari v1, tetapi kolom
// dan enum-nya tetap ada di backend, jadi cabangnya tidak dihapus dari UI.
export type SenderKind = 'visitor' | 'ai' | 'staff';

// `id` di sini adalah public_id (uuid); backend tidak pernah mengirim id numerik.
export type ConversationRow = {
  id: string;
  facility_id: string | null;
  status: ConversationStatus;
  escalated_at: string | null;
  escalation_reason: EscalationReason | null;
  assigned_user_id: string | null;
  closed_at: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  sender_kind: SenderKind;
  // null setelah masa retensi (privacy:purge-expired), bukan pesan kosong.
  body: string | null;
  created_at: string;
};

export type ConversationPage = ApiPaginated<ConversationRow>;
export type ChatMessagePage = ApiPaginated<ChatMessage>;
export type ConversationResult = ApiSuccess<ConversationRow>;
export type ChatMessageResult = ApiSuccess<ChatMessage>;

export const CONVERSATION_STATUSES: readonly ConversationStatus[] = ['open', 'escalated', 'assigned', 'closed'];
export const ESCALATION_REASONS: readonly EscalationReason[] = [
  'personal_medical_question',
  'lab_result_question',
  'complaint',
  'other',
];
export const CHAT_MESSAGE_MAX = 2000;

// Kontrak hanya mendokumentasikan filter[status]; urutan (escalated_at) ditetapkan
// backend, jadi per_page dan sort sengaja tidak dikirim.
export function buildConversationsPath(status: ConversationStatus | '', cursor: string | null): string {
  const params = new URLSearchParams();

  if (status) params.set('filter[status]', status);
  if (cursor !== null) params.set('cursor', cursor);

  const query = params.toString();
  return query ? `/inbox/conversations?${query}` : '/inbox/conversations';
}

// Rute /inbox/*, bukan /conversations/*: yang terakhir milik pengunjung dan
// mensyaratkan X-Visitor-Token.
export function buildConversationMessagesPath(conversationId: string, cursor: string | null): string {
  const path = `/inbox/conversations/${encodeURIComponent(conversationId)}/messages`;
  if (cursor === null) return path;

  const params = new URLSearchParams({ cursor });
  return `${path}?${params.toString()}`;
}

function idempotentPost(path: string, body?: unknown): [string, RequestInit] {
  const headers: Record<string, string> = { 'idempotency-key': newIdempotencyKey() };
  if (body !== undefined) headers['content-type'] = 'application/json';

  return [
    path,
    {
      method: 'POST',
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  ];
}

// Tiga fungsi di bawah dipanggil sekali di handler aksi pengguna; [path, init]
// yang sama dipakai ulang di setiap percobaan aksi itu supaya Idempotency-Key-nya
// tidak berganti.
export function assignConversationInit(conversationId: string): [string, RequestInit] {
  return idempotentPost(`/inbox/conversations/${encodeURIComponent(conversationId)}/assign`);
}

export function closeConversationInit(conversationId: string): [string, RequestInit] {
  return idempotentPost(`/inbox/conversations/${encodeURIComponent(conversationId)}/close`);
}

export function postStaffMessageInit(conversationId: string, body: string): [string, RequestInit] {
  return idempotentPost(`/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, { body });
}
