"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sendMessage, markMessageRead } from "@/lib/actions/inbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHANNEL_LABELS } from "@/types/crm";
import type { Channel } from "@/types/crm";
import { Send, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";

type Conversation = {
  contact_id: string | null;
  contact: Record<string, unknown> | null;
  messages: Record<string, unknown>[];
  unread_count: number;
  last_message: Record<string, unknown>;
  channel: string;
};

type Props = {
  conversation: Conversation;
  orgId: string;
};

export function MessageThread({ conversation, orgId }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const contact = conversation.contact as Record<string, unknown> | null;
  const contactName = contact
    ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim()
    : "Unknown";

  // Sort messages ascending by timestamp
  const messages = [...conversation.messages].sort(
    (a, b) =>
      new Date(a.timestamp as string).getTime() -
      new Date(b.timestamp as string).getTime()
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark unread messages as read
  useEffect(() => {
    const unread = messages.filter((m) => !m.read && m.direction === "inbound");
    for (const msg of unread) {
      markMessageRead(msg.id as string);
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!body.trim() || !conversation.contact_id) return;
    setSending(true);
    await sendMessage({
      contact_id: conversation.contact_id,
      channel: conversation.channel as Channel,
      body: body.trim(),
    });
    setBody("");
    setSending(false);
    router.refresh();
  }, [body, conversation.contact_id, conversation.channel, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)]">
        <div className="flex size-9 items-center justify-center rounded-full bg-muted shrink-0">
          <span className="text-sm font-bold text-[var(--text-muted)]">
            {contactName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {contactName}
          </h3>
          <span className="text-[0.65rem] text-[var(--text-hint)]">
            {CHANNEL_LABELS[conversation.channel as Channel] ??
              conversation.channel}
          </span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => {
            const isOutbound = msg.direction === "outbound";
            return (
              <div
                key={msg.id as string}
                className={cn(
                  "flex flex-col max-w-[75%] gap-1",
                  isOutbound ? "self-end items-end" : "self-start items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-xl px-3.5 py-2.5 text-sm",
                    isOutbound
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                  )}
                >
                  {msg.subject ? (
                    <p className="font-semibold text-xs mb-1">
                      {String(msg.subject)}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">
                    {String(msg.body)}
                  </p>
                </div>
                <span className="text-[0.6rem] text-[var(--text-hint)]">
                  {format(
                    new Date(msg.timestamp as string),
                    "MMM dd, h:mm a"
                  )}
                </span>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Compose */}
      {conversation.contact_id && (
        <div className="border-t border-[var(--border-default)] px-4 py-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="rounded-xl min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              size="icon"
              className="rounded-full shrink-0 size-10"
              onClick={handleSend}
              disabled={sending || !body.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
