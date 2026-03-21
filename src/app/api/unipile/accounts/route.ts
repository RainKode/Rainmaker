import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as unipileClient from "@/lib/unipile/client";

/**
 * GET /api/unipile/accounts — list connected Unipile accounts.
 * Requires authenticated user.
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
    const accounts = await unipileClient.listAccounts({ limit: 100 });
    return NextResponse.json(accounts);
  } catch (err) {
    console.error("Unipile accounts error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Unipile accounts" },
      { status: 502 }
    );
  }
}
