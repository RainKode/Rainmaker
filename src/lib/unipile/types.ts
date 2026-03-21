// ─── Unipile API Response Types ─────────────────────────────────────────────
// Based on https://developer.unipile.com/reference

// ─── Common ─────────────────────────────────────────────────────────────────

export type UnipileError = {
  object: "Error";
  status: number;
  type: string;
  title: string;
  detail?: string;
};

// ─── Accounts ───────────────────────────────────────────────────────────────

export type AccountType =
  | "MOBILE"
  | "MAIL"
  | "GOOGLE"
  | "ICLOUD"
  | "OUTLOOK"
  | "GOOGLE CALENDAR"
  | "WHATSAPP"
  | "LINKEDIN"
  | "SLACK"
  | "TWITTER"
  | "EXCHANGE"
  | "TELEGRAM"
  | "INSTAGRAM"
  | "MESSENGER";

export type UnipileAccount = {
  object: "Account";
  type: AccountType;
  id: string;
  name: string;
  created_at: string;
  current_sign_in_status: string;
  connection_params?: Record<string, unknown>;
  last_fetched_at?: string;
  sources?: string[];
};

export type AccountListResponse = {
  object: "AccountList";
  items: UnipileAccount[];
  cursor: string | null;
};

// ─── Chats ──────────────────────────────────────────────────────────────────

export type UnipileChat = {
  object: "Chat";
  id: string;
  account_id: string;
  account_type: AccountType;
  provider_id: string;
  attendee_provider_id?: string;
  name: string;
  type: number;
  timestamp: string;
  unread_count: number;
  archived: number;
  muted_until: number | string;
  read_only: number;
  disabledFeatures?: string[];
  subject?: string;
  organization_id?: string;
  mailbox_id?: string;
  content_type?: string;
  folder?: string[];
  pinned: number;
};

export type ChatListResponse = {
  object: "ChatList";
  items: UnipileChat[];
  cursor: string | null;
};

export type ChatStartedResponse = {
  object: "ChatStarted";
  chat_id: string;
  message_id: string;
};

// ─── Messages ───────────────────────────────────────────────────────────────

export type UnipileMessage = {
  object: "Message";
  id: string;
  account_id: string;
  provider_id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  timestamp: string;
  is_sender: boolean;
  attachments?: UnipileAttachment[];
};

export type UnipileAttachment = {
  id: string;
  name: string;
  size?: number;
  mime_type?: string;
};

export type MessageListResponse = {
  object: "MessageList";
  items: UnipileMessage[];
  cursor: string | null;
};

export type MessageSentResponse = {
  object: "MessageSent";
  message_id: string;
};

// ─── Emails ─────────────────────────────────────────────────────────────────

export type EmailSentResponse = {
  object: "EmailSent";
  tracking_id: string;
  provider_id: string;
};

export type EmailRecipient = {
  display_name?: string;
  identifier: string;
};

// ─── Webhooks ───────────────────────────────────────────────────────────────

export type WebhookCreatedResponse = {
  object: "WebhookCreated";
  webhook_id: string;
};

export type UnipileWebhook = {
  object: "Webhook";
  id: string;
  request_url: string;
  name?: string;
  source: "messaging";
  enabled: boolean;
  events?: string[];
};

export type WebhookListResponse = {
  object: "WebhookList";
  items: UnipileWebhook[];
};

// ─── Attendees ──────────────────────────────────────────────────────────────

export type UnipileAttendee = {
  object: "Attendee";
  id: string;
  provider_id: string;
  display_name: string;
  profile_picture_url?: string;
};

export type AttendeeListResponse = {
  object: "AttendeeList";
  items: UnipileAttendee[];
  cursor: string | null;
};
