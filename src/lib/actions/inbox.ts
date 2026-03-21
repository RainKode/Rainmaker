"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessageSchema } from "@/lib/validations/crm";
import * as unipile from "@/lib/unipile/client";

export type ActionState = {
  error?: string;
  success?: string;
  data?: unknown;
};

// ─── Helper: get org membership ─────────────────────────────────────────────

async function getOrgContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const, supabase, user: null, orgId: null };

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership)
    return { error: "No organisation found" as const, supabase, user, orgId: null };

  return { error: null, supabase, user, orgId: membership.organisation_id };
}

// ═══════════════════════════════════════════════════════════════════════════
// Send Message (Outbound)
// ═══════════════════════════════════════════════════════════════════════════

export async function sendMessage(data: {
  contact_id: string;
  channel: string;
  body: string;
  subject?: string;
  attachments?: Record<string, unknown>[];
  unipile_chat_id?: string;
}): Promise<ActionState> {
  const parsed = sendMessageSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  // ─── Send via Unipile API ──────────────────────────────────────────────
  let unipileMessageId: string | null = null;
  try {
    if (parsed.data.channel === "email") {
      // Email uses dedicated email endpoint
      const emailResult = await unipile.sendEmail({
        account_id: parsed.data.unipile_chat_id || "",
        to: [{ identifier: parsed.data.contact_id }],
        body: parsed.data.body,
        subject: parsed.data.subject,
      });
      unipileMessageId = emailResult.provider_id ?? null;
    } else if (parsed.data.unipile_chat_id) {
      // Existing chat — send message into it
      const msgResult = await unipile.sendChatMessage(
        parsed.data.unipile_chat_id,
        { text: parsed.data.body }
      );
      unipileMessageId = msgResult.message_id ?? null;
    }
    // If no unipile_chat_id and not email, message is logged locally only
  } catch (err) {
    console.error("Unipile send error:", err);
    return { error: "Failed to send message via Unipile" };
  }

  // Log message to database
  const { data: message, error } = await ctx.supabase
    .from("messages")
    .insert({
      organisation_id: ctx.orgId,
      contact_id: parsed.data.contact_id,
      channel: parsed.data.channel,
      direction: "outbound",
      body: parsed.data.body,
      subject: parsed.data.subject || null,
      attachments: parsed.data.attachments || [],
      sent_by_user_id: ctx.user!.id,
      unipile_chat_id: parsed.data.unipile_chat_id || null,
      unipile_message_id: unipileMessageId,
      read: true,
      timestamp: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Update contact last_contact_date
  await ctx.supabase
    .from("contacts")
    .update({ last_contact_date: new Date().toISOString() })
    .eq("id", parsed.data.contact_id);

  return { success: "Message sent", data: message };
}

// ═══════════════════════════════════════════════════════════════════════════
// Match Contact to Unassigned Message
// ═══════════════════════════════════════════════════════════════════════════

export async function matchContact(
  messageId: string,
  contactId: string
): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("messages")
    .update({ contact_id: contactId })
    .eq("id", messageId);

  if (error) return { error: error.message };
  return { success: "Contact matched" };
}

// ═══════════════════════════════════════════════════════════════════════════
// Mark Message Read
// ═══════════════════════════════════════════════════════════════════════════

export async function markMessageRead(messageId: string): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("messages")
    .update({ read: true })
    .eq("id", messageId);

  if (error) return { error: error.message };
  return { success: "Message marked as read" };
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Conversations (grouped by contact)
// ═══════════════════════════════════════════════════════════════════════════

export async function getConversations(filters?: {
  channel?: string;
  unread_only?: boolean;
}): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  let query = ctx.supabase
    .from("messages")
    .select(
      "*, contact:contacts(id, first_name, last_name, email)"
    )
    .eq("organisation_id", ctx.orgId)
    .order("timestamp", { ascending: false });

  if (filters?.channel) {
    query = query.eq("channel", filters.channel);
  }

  const { data: messages, error } = await query;
  if (error) return { error: error.message };

  // Group by contact_id (or unipile_chat_id for unmatched)
  const threads = new Map<
    string,
    {
      contact_id: string | null;
      contact: { id: string; first_name: string; last_name: string; email: string | null } | null;
      last_message: Record<string, unknown>;
      unread_count: number;
      channel: string;
    }
  >();

  for (const msg of messages as Record<string, unknown>[]) {
    const key = (msg.contact_id as string) || (msg.unipile_chat_id as string) || (msg.id as string);
    if (!threads.has(key)) {
      threads.set(key, {
        contact_id: msg.contact_id as string | null,
        contact: msg.contact as { id: string; first_name: string; last_name: string; email: string | null } | null,
        last_message: msg,
        unread_count: msg.read ? 0 : 1,
        channel: msg.channel as string,
      });
    } else {
      const thread = threads.get(key)!;
      if (!msg.read) thread.unread_count++;
    }
  }

  let result = Array.from(threads.values());

  if (filters?.unread_only) {
    result = result.filter((t) => t.unread_count > 0);
  }

  return { success: "Conversations fetched", data: result };
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Messages for a Contact
// ═══════════════════════════════════════════════════════════════════════════

export async function getMessages(contactId: string): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("messages")
    .select("*")
    .eq("contact_id", contactId)
    .order("timestamp", { ascending: true });

  if (error) return { error: error.message };
  return { success: "Messages fetched", data };
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Unassigned Messages
// ═══════════════════════════════════════════════════════════════════════════

export async function getUnassignedMessages(): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("messages")
    .select("*")
    .eq("organisation_id", ctx.orgId)
    .is("contact_id", null)
    .order("timestamp", { ascending: false });

  if (error) return { error: error.message };
  return { success: "Unassigned messages fetched", data };
}

// ═══════════════════════════════════════════════════════════════════════════
// List Unipile Accounts (connected messaging providers)
// ═══════════════════════════════════════════════════════════════════════════

export async function getUnipileAccounts(): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  try {
    const result = await unipile.listAccounts({ limit: 100 });
    return { success: "Accounts fetched", data: result.items };
  } catch (err) {
    console.error("Unipile listAccounts error:", err);
    return { error: "Failed to fetch Unipile accounts" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// List Unipile Chats (conversations from providers)
// ═══════════════════════════════════════════════════════════════════════════

export async function getUnipileChats(params?: {
  account_id?: string;
  account_type?: string;
  unread?: boolean;
  limit?: number;
  cursor?: string;
}): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  try {
    const result = await unipile.listChats(params);
    return { success: "Chats fetched", data: result };
  } catch (err) {
    console.error("Unipile listChats error:", err);
    return { error: "Failed to fetch Unipile chats" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Get Unipile Chat Messages (from provider)
// ═══════════════════════════════════════════════════════════════════════════

export async function getUnipileChatMessages(
  chatId: string,
  params?: { limit?: number; cursor?: string }
): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  try {
    const result = await unipile.listChatMessages(chatId, params);
    return { success: "Chat messages fetched", data: result };
  } catch (err) {
    console.error("Unipile listChatMessages error:", err);
    return { error: "Failed to fetch chat messages" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Start New Unipile Chat
// ═══════════════════════════════════════════════════════════════════════════

export async function startUnipileChat(data: {
  account_id: string;
  attendees_ids: string[];
  text?: string;
  subject?: string;
}): Promise<ActionState> {
  const ctx = await getOrgContext();
  if (ctx.error) return { error: ctx.error };

  try {
    const result = await unipile.startNewChat(data);
    return { success: "Chat started", data: result };
  } catch (err) {
    console.error("Unipile startNewChat error:", err);
    return { error: "Failed to start new chat" };
  }
}
