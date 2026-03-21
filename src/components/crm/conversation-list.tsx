"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CHANNEL_LABELS } from "@/types/crm";
import type { Channel } from "@/types/crm";
import { Mail, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Conversation = {
  contact_id: string | null;
  contact: Record<string, unknown> | null;
  messages: Record<string, unknown>[];
  unread_count: number;
  last_message: Record<string, unknown>;
  channel: string;
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  linkedin: MessageCircle,
  instagram: MessageCircle,
  telegram: MessageCircle,
  messenger: MessageCircle,
};

type Props = {
  conversations: Conversation[];
  selectedContactId: string | null;
  onSelect: (contactId: string | null) => void;
};

export function ConversationList({
  conversations,
  selectedContactId,
  onSelect,
}: Props) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {conversations.map((conv) => {
          const contact = conv.contact as Record<string, unknown> | null;
          const contactName = contact
            ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim()
            : "Unknown";
          const lastMsg = conv.last_message;
          const Icon = CHANNEL_ICONS[conv.channel] ?? MessageCircle;
          const isSelected = conv.contact_id === selectedContactId;

          return (
            <button
              key={conv.contact_id ?? `no-contact`}
              type="button"
              onClick={() => onSelect(conv.contact_id)}
              className={cn(
                "flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[var(--border-default)]/50 min-h-[64px]",
                isSelected
                  ? "bg-[var(--accent-primary)]/8 border-l-2 border-l-[var(--accent-primary)]"
                  : "hover:bg-[var(--bg-hover)]"
              )}
            >
              {/* Avatar */}
              <div className="flex size-10 items-center justify-center rounded-full bg-muted shrink-0 mt-0.5">
                <span className="text-sm font-bold text-[var(--text-muted)]">
                  {contactName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {contactName}
                  </span>
                  <span className="text-[0.65rem] text-[var(--text-hint)] shrink-0">
                    {formatDistanceToNow(
                      new Date(lastMsg.timestamp as string),
                      { addSuffix: true }
                    )}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                  {(lastMsg.subject as string) ||
                    (lastMsg.body as string) ||
                    "No content"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Icon className="size-3 text-[var(--text-hint)]" />
                  <span className="text-[0.6rem] text-[var(--text-hint)]">
                    {CHANNEL_LABELS[conv.channel as Channel] ?? conv.channel}
                  </span>
                  {conv.unread_count > 0 && (
                    <Badge
                      variant="default"
                      className="h-4 px-1.5 text-[0.55rem] rounded-full bg-[var(--accent-primary)] text-white"
                    >
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="size-8 text-[var(--text-hint)] mb-2" />
            <p className="text-sm text-[var(--text-muted)]">
              No conversations yet
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
