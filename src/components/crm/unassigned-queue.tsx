"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { matchContact } from "@/lib/actions/inbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHANNEL_LABELS } from "@/types/crm";
import type { Channel } from "@/types/crm";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, AlertCircle, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Conversation = {
  contact_id: string | null;
  contact: Record<string, unknown> | null;
  messages: Record<string, unknown>[];
  unread_count: number;
  last_message: Record<string, unknown>;
  channel: string;
};

type Props = {
  conversations: Conversation[];
};

export function UnassignedQueue({ conversations }: Props) {
  const router = useRouter();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <AlertCircle className="size-12 text-[var(--text-hint)] mb-3" />
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
          All caught up!
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          No unassigned messages waiting for review.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {conversations.map((conv, index) => (
          <UnassignedCard
            key={conv.last_message.id as string}
            conversation={conv}
            onMatched={() => router.refresh()}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function UnassignedCard({
  conversation,
  onMatched,
}: {
  conversation: Conversation;
  onMatched: () => void;
}) {
  const lastMsg = conversation.last_message;
  const senderName =
    (lastMsg.sender_name as string) ??
    (lastMsg.sender_identifier as string) ??
    "Unknown sender";

  return (
    <Card className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
            {senderName}
          </CardTitle>
          <span className="text-[0.6rem] text-[var(--text-hint)]">
            {formatDistanceToNow(new Date(lastMsg.timestamp as string), {
              addSuffix: true,
            })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <MessageCircle className="size-3 text-[var(--text-hint)]" />
          <span className="text-[0.65rem] text-[var(--text-hint)]">
            {CHANNEL_LABELS[conversation.channel as Channel] ??
              conversation.channel}
          </span>
          {conversation.messages.length > 1 && (
            <span className="text-[0.6rem] text-[var(--text-muted)]">
              · {conversation.messages.length} messages
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[var(--text-muted)] line-clamp-3 mb-3">
          {(lastMsg.body as string) ?? "No content"}
        </p>
        <MatchContactDialog
          messageId={lastMsg.id as string}
          senderIdentifier={lastMsg.sender_identifier as string}
          onMatched={onMatched}
        />
      </CardContent>
    </Card>
  );
}

function MatchContactDialog({
  messageId,
  senderIdentifier,
  onMatched,
}: {
  messageId: string;
  senderIdentifier: string;
  onMatched: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [matching, setMatching] = useState(false);

  const handleMatch = useCallback(async () => {
    if (!contactId.trim()) return;
    setMatching(true);
    await matchContact(messageId, contactId.trim());
    setMatching(false);
    setOpen(false);
    onMatched();
  }, [messageId, contactId, onMatched]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="rounded-full w-full" />}>
          <UserPlus className="size-3.5 mr-1.5" />
          Match to Contact
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm bg-[var(--bg-card)] border-[var(--border-default)]">
        <DialogHeader>
          <DialogTitle>Match Message to Contact</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            From: {senderIdentifier ?? "Unknown"}
          </p>
          <Input
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            placeholder="Contact ID"
            className="rounded-xl"
          />
          <Button
            className="rounded-full"
            onClick={handleMatch}
            disabled={matching || !contactId.trim()}
          >
            {matching ? "Matching…" : "Match Contact"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
