"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/crm/conversation-list";
import { MessageThread } from "@/components/crm/message-thread";
import { UnassignedQueue } from "@/components/crm/unassigned-queue";
import { subscribeToMessages } from "@/lib/events/realtime";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, AlertCircle } from "lucide-react";

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
  orgId: string;
};

export function InboxClient({ conversations, orgId }: Props) {
  const router = useRouter();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    conversations[0]?.contact_id ?? null
  );
  const [tab, setTab] = useState<"inbox" | "unassigned">("inbox");

  useEffect(() => {
    const unsub = subscribeToMessages(orgId, () => {
      router.refresh();
    });
    return unsub;
  }, [orgId, router]);

  const selectedConversation = conversations.find(
    (c) => c.contact_id === selectedContactId
  );

  const unassignedConversations = conversations.filter(
    (c) => !c.contact_id
  );
  const assignedConversations = conversations.filter(
    (c) => c.contact_id !== null
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Universal Inbox</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            All conversations in one place
          </p>
        </div>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "inbox" | "unassigned")}
        >
          <TabsList className="rounded-xl">
            <TabsTrigger value="inbox" className="rounded-xl">
              <Inbox className="size-4 mr-1.5" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="unassigned" className="rounded-xl">
              <AlertCircle className="size-4 mr-1.5" />
              Unassigned
              {unassignedConversations.length > 0 && (
                <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white text-[0.6rem] font-bold">
                  {unassignedConversations.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {tab === "unassigned" ? (
        <UnassignedQueue conversations={unassignedConversations} />
      ) : (
        <ResizablePanelGroup className="flex-1">
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <ConversationList
              conversations={assignedConversations}
              selectedContactId={selectedContactId}
              onSelect={setSelectedContactId}
            />
          </ResizablePanel>
          <ResizableHandle className="bg-[var(--border-default)]" />
          <ResizablePanel defaultSize={65}>
            {selectedConversation ? (
              <MessageThread
                conversation={selectedConversation}
                orgId={orgId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Inbox className="size-12 text-[var(--text-hint)] mb-3" />
                <p className="text-sm text-[var(--text-muted)]">
                  Select a conversation to start messaging
                </p>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
