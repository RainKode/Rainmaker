import type {
  AccountListResponse,
  AttendeeListResponse,
  ChatListResponse,
  ChatStartedResponse,
  EmailRecipient,
  EmailSentResponse,
  MessageListResponse,
  MessageSentResponse,
  UnipileAccount,
  UnipileChat,
  WebhookCreatedResponse,
  WebhookListResponse,
} from "./types";

// ─── Config ─────────────────────────────────────────────────────────────────

function getConfig() {
  const apiUrl = process.env.UNIPILE_API_URL;
  const apiKey = process.env.UNIPILE_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      "Missing UNIPILE_API_URL or UNIPILE_API_KEY environment variables"
    );
  }

  return { apiUrl: apiUrl.replace(/\/$/, ""), apiKey };
}

// ─── Base Fetch ─────────────────────────────────────────────────────────────

async function unipileFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiUrl, apiKey } = getConfig();

  const url = `${apiUrl}/api/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "X-API-KEY": apiKey,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unipile API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

async function unipileFormFetch<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const { apiUrl, apiKey } = getConfig();

  const url = `${apiUrl}/api/v1${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "X-API-KEY": apiKey,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unipile API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ═════════════════════════════════════════════════════════════════════════════
// Accounts
// ═════════════════════════════════════════════════════════════════════════════

export async function listAccounts(params?: {
  cursor?: string;
  limit?: number;
}): Promise<AccountListResponse> {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return unipileFetch<AccountListResponse>(
    `/accounts${query ? `?${query}` : ""}`
  );
}

export async function getAccount(accountId: string): Promise<UnipileAccount> {
  return unipileFetch<UnipileAccount>(`/accounts/${encodeURIComponent(accountId)}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// Chats (Messaging)
// ═════════════════════════════════════════════════════════════════════════════

export async function listChats(params?: {
  account_id?: string;
  account_type?: string;
  unread?: boolean;
  before?: string;
  after?: string;
  cursor?: string;
  limit?: number;
}): Promise<ChatListResponse> {
  const qs = new URLSearchParams();
  if (params?.account_id) qs.set("account_id", params.account_id);
  if (params?.account_type) qs.set("account_type", params.account_type);
  if (params?.unread !== undefined) qs.set("unread", String(params.unread));
  if (params?.before) qs.set("before", params.before);
  if (params?.after) qs.set("after", params.after);
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return unipileFetch<ChatListResponse>(`/chats${query ? `?${query}` : ""}`);
}

export async function getChat(chatId: string): Promise<UnipileChat> {
  return unipileFetch<UnipileChat>(`/chats/${encodeURIComponent(chatId)}`);
}

export async function startNewChat(data: {
  account_id: string;
  attendees_ids: string[];
  text?: string;
  subject?: string;
}): Promise<ChatStartedResponse> {
  const formData = new FormData();
  formData.append("account_id", data.account_id);
  data.attendees_ids.forEach((id) =>
    formData.append("attendees_ids[]", id)
  );
  if (data.text) formData.append("text", data.text);
  if (data.subject) formData.append("subject", data.subject);

  return unipileFormFetch<ChatStartedResponse>("/chats", formData);
}

// ═════════════════════════════════════════════════════════════════════════════
// Chat Messages
// ═════════════════════════════════════════════════════════════════════════════

export async function listChatMessages(
  chatId: string,
  params?: { cursor?: string; limit?: number; before?: string; after?: string }
): Promise<MessageListResponse> {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.before) qs.set("before", params.before);
  if (params?.after) qs.set("after", params.after);
  const query = qs.toString();
  return unipileFetch<MessageListResponse>(
    `/chats/${encodeURIComponent(chatId)}/messages${query ? `?${query}` : ""}`
  );
}

export async function sendChatMessage(
  chatId: string,
  data: { text: string; account_id?: string }
): Promise<MessageSentResponse> {
  const formData = new FormData();
  formData.append("text", data.text);
  if (data.account_id) formData.append("account_id", data.account_id);

  return unipileFormFetch<MessageSentResponse>(
    `/chats/${encodeURIComponent(chatId)}/messages`,
    formData
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Emails
// ═════════════════════════════════════════════════════════════════════════════

export async function sendEmail(data: {
  account_id: string;
  to: EmailRecipient[];
  body: string;
  subject?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  reply_to?: string;
}): Promise<EmailSentResponse> {
  const formData = new FormData();
  formData.append("account_id", data.account_id);
  formData.append("body", data.body);
  if (data.subject) formData.append("subject", data.subject);
  if (data.reply_to) formData.append("reply_to", data.reply_to);

  data.to.forEach((r, i) => {
    formData.append(`to[${i}][identifier]`, r.identifier);
    if (r.display_name) formData.append(`to[${i}][display_name]`, r.display_name);
  });

  data.cc?.forEach((r, i) => {
    formData.append(`cc[${i}][identifier]`, r.identifier);
    if (r.display_name) formData.append(`cc[${i}][display_name]`, r.display_name);
  });

  data.bcc?.forEach((r, i) => {
    formData.append(`bcc[${i}][identifier]`, r.identifier);
    if (r.display_name) formData.append(`bcc[${i}][display_name]`, r.display_name);
  });

  return unipileFormFetch<EmailSentResponse>("/emails", formData);
}

// ═════════════════════════════════════════════════════════════════════════════
// Chat Attendees
// ═════════════════════════════════════════════════════════════════════════════

export async function listChatAttendees(
  chatId: string
): Promise<AttendeeListResponse> {
  return unipileFetch<AttendeeListResponse>(
    `/chats/${encodeURIComponent(chatId)}/attendees`
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Webhooks
// ═════════════════════════════════════════════════════════════════════════════

export async function listWebhooks(): Promise<WebhookListResponse> {
  return unipileFetch<WebhookListResponse>("/webhooks");
}

export async function createWebhook(data: {
  request_url: string;
  name?: string;
  source: "messaging";
  events?: string[];
  account_ids?: string[];
  enabled?: boolean;
}): Promise<WebhookCreatedResponse> {
  return unipileFetch<WebhookCreatedResponse>("/webhooks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const { apiUrl, apiKey } = getConfig();
  const res = await fetch(
    `${apiUrl}/api/v1/webhooks/${encodeURIComponent(webhookId)}`,
    {
      method: "DELETE",
      headers: { "X-API-KEY": apiKey },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unipile API error ${res.status}: ${body}`);
  }
}
