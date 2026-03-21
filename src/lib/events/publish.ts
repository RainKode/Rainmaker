"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-side helper to publish an event to the shared.events table
 * via the publish_event() RPC function.
 * Use this when DB triggers are insufficient (e.g., application-level events).
 */
export async function publishEvent(params: {
  orgId: string;
  eventType: string;
  sourceTable: string;
  sourceId: string;
  payload?: Record<string, unknown>;
  sourceEventId?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("publish_event", {
    p_org_id: params.orgId,
    p_event_type: params.eventType,
    p_source_table: params.sourceTable,
    p_source_id: params.sourceId,
    p_payload: params.payload || {},
    p_source_event_id: params.sourceEventId || null,
  });

  if (error) return { id: null, error: error.message };
  return { id: data as string, error: null };
}
