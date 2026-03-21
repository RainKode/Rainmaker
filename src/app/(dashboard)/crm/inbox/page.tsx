import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InboxClient } from "./client";

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) redirect("/onboarding");

  // Get conversations grouped by contact
  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      *,
      contact:contacts!contact_id(id, first_name, last_name, email)
    `
    )
    .eq("organisation_id", membership.organisation_id)
    .order("timestamp", { ascending: false });

  // Group by contact
  const conversationMap = new Map<
    string,
    {
      contact_id: string | null;
      contact: Record<string, unknown> | null;
      messages: Record<string, unknown>[];
      unread_count: number;
      last_message: Record<string, unknown>;
      channel: string;
    }
  >();

  for (const msg of messages ?? []) {
    const key = msg.contact_id ?? `unassigned-${msg.id}`;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        contact_id: msg.contact_id,
        contact: msg.contact,
        messages: [],
        unread_count: 0,
        last_message: msg,
        channel: msg.channel,
      });
    }
    const conv = conversationMap.get(key)!;
    conv.messages.push(msg);
    if (!msg.read) conv.unread_count++;
  }

  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) =>
      new Date(b.last_message.timestamp as string).getTime() -
      new Date(a.last_message.timestamp as string).getTime()
  );

  return (
    <InboxClient
      conversations={conversations}
      orgId={membership.organisation_id}
    />
  );
}
