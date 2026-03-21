import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * Unipile Webhook — receives inbound messages from WhatsApp, Email, LinkedIn etc.
 * Validates the HMAC-SHA256 signature, inserts the message, and attempts contact matching.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.UNIPILE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // ─── Verify HMAC signature ──────────────────────────────────────────
  const signature = request.headers.get("x-unipile-signature") ?? "";
  const rawBody = await request.text();

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (
    !signature ||
    !crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ─── Parse payload ──────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.event as string | undefined;
  if (eventType !== "message.received") {
    // Acknowledge non-message events
    return NextResponse.json({ ok: true });
  }

  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) {
    return NextResponse.json({ error: "No data in payload" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // ─── Determine organisation from account ────────────────────────────
  // The account_id maps to an org via a config table or env.
  // For now we use a simple header or payload field.
  const orgId = (data.organisation_id as string) ?? null;
  if (!orgId) {
    return NextResponse.json(
      { error: "Missing organisation_id" },
      { status: 400 }
    );
  }

  // ─── Try to match sender to existing contact ───────────────────────
  const senderIdentifier = (data.sender_identifier as string) ?? null;
  let contactId: string | null = null;

  if (senderIdentifier) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("organisation_id", orgId)
      .or(`email.eq.${senderIdentifier},phone.eq.${senderIdentifier}`)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (contact) contactId = contact.id;
  }

  // ─── Insert message ────────────────────────────────────────────────
  const channel = (data.channel as string) ?? "email";
  const { error } = await supabase.from("messages").insert({
    organisation_id: orgId,
    contact_id: contactId,
    unipile_chat_id: (data.chat_id as string) ?? null,
    unipile_message_id: (data.message_id as string) ?? null,
    channel,
    direction: "inbound",
    sender_identifier: senderIdentifier,
    sender_name: (data.sender_name as string) ?? null,
    subject: (data.subject as string) ?? null,
    body: (data.body as string) ?? null,
    body_html: (data.body_html as string) ?? null,
    attachments: (data.attachments as Record<string, unknown>[]) ?? [],
    thread_id: (data.thread_id as string) ?? null,
    cc: (data.cc as string[]) ?? [],
    bcc: (data.bcc as string[]) ?? [],
    read: false,
    timestamp: (data.timestamp as string) ?? new Date().toISOString(),
  });

  if (error) {
    console.error("Webhook insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update contact's last_contact_date
  if (contactId) {
    await supabase
      .from("contacts")
      .update({ last_contact_date: new Date().toISOString() })
      .eq("id", contactId);
  }

  return NextResponse.json({ ok: true });
}
