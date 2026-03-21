import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as unipileClient from "@/lib/unipile/client";

/**
 * GET /api/unipile/webhooks — list registered Unipile webhooks.
 * POST /api/unipile/webhooks — register a new webhook pointing to our ingest endpoint.
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const webhooks = await unipileClient.listWebhooks();
    return NextResponse.json(webhooks);
  } catch (err) {
    console.error("Unipile webhooks list error:", err);
    return NextResponse.json(
      { error: "Failed to list webhooks" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin/owner role
  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL not configured" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as { name?: string; events?: string[] };

    const result = await unipileClient.createWebhook({
      request_url: `${appUrl}/api/webhooks/unipile`,
      name: body.name || "Rainmaker Inbox",
      source: "messaging",
      events: body.events || ["message_received"],
      enabled: true,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Unipile webhook create error:", err);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 502 }
    );
  }
}
