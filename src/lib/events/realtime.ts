"use client";

import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to Supabase Realtime events on the shared.events table.
 * Returns an unsubscribe function.
 */
export function subscribeToEvents(
  orgId: string,
  eventTypes: string[],
  callback: (payload: {
    event_type: string;
    source_id: string;
    payload: Record<string, unknown>;
  }) => void
): () => void {
  const supabase = createClient();

  const channel: RealtimeChannel = supabase
    .channel(`events:${orgId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "shared",
        table: "events",
        filter: `organisation_id=eq.${orgId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (eventTypes.length === 0 || eventTypes.includes(row.event_type as string)) {
          callback({
            event_type: row.event_type as string,
            source_id: row.source_id as string,
            payload: (row.payload as Record<string, unknown>) || {},
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to task table changes for real-time Kanban/List updates.
 */
export function subscribeToTasks(
  orgId: string,
  callback: (
    eventType: "INSERT" | "UPDATE" | "DELETE",
    record: Record<string, unknown>
  ) => void
): () => void {
  const supabase = createClient();

  const channel: RealtimeChannel = supabase
    .channel(`tasks:${orgId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "task",
        table: "tasks",
        filter: `organisation_id=eq.${orgId}`,
      },
      (payload) => {
        callback(
          payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          (payload.new as Record<string, unknown>) || {}
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to CRM contacts table changes.
 */
export function subscribeToContacts(
  orgId: string,
  callback: (
    eventType: "INSERT" | "UPDATE" | "DELETE",
    record: Record<string, unknown>
  ) => void
): () => void {
  const supabase = createClient();

  const channel: RealtimeChannel = supabase
    .channel(`contacts:${orgId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "crm",
        table: "contacts",
        filter: `organisation_id=eq.${orgId}`,
      },
      (payload) => {
        callback(
          payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          (payload.new as Record<string, unknown>) || {}
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to CRM deals table changes.
 */
export function subscribeToDeals(
  orgId: string,
  callback: (
    eventType: "INSERT" | "UPDATE" | "DELETE",
    record: Record<string, unknown>
  ) => void
): () => void {
  const supabase = createClient();

  const channel: RealtimeChannel = supabase
    .channel(`deals:${orgId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "crm",
        table: "deals",
        filter: `organisation_id=eq.${orgId}`,
      },
      (payload) => {
        callback(
          payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          (payload.new as Record<string, unknown>) || {}
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to CRM messages table changes.
 */
export function subscribeToMessages(
  orgId: string,
  callback: (
    eventType: "INSERT" | "UPDATE" | "DELETE",
    record: Record<string, unknown>
  ) => void
): () => void {
  const supabase = createClient();

  const channel: RealtimeChannel = supabase
    .channel(`messages:${orgId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "crm",
        table: "messages",
        filter: `organisation_id=eq.${orgId}`,
      },
      (payload) => {
        callback(
          payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          (payload.new as Record<string, unknown>) || {}
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to notification inserts for live notification bell updates.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Record<string, unknown>) => void
): () => void {
  const supabase = createClient();

  const channel: RealtimeChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "shared",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Record<string, unknown>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
