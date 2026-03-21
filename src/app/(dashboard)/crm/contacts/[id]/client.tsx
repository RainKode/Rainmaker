"use client";

import { useState } from "react";
import { ContactDetailHeader } from "@/components/crm/contact-detail-header";
import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { CommentSection } from "@/components/crm/comment-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { ContactWithDetails, Message } from "@/types/crm";

type Props = {
  contact: ContactWithDetails;
  deals: Record<string, unknown>[];
  messages: Message[];
  comments: Record<string, unknown>[];
  orgId: string;
};

export function ContactDetailClient({
  contact,
  deals,
  messages,
  comments,
}: Props) {
  const [activeTab, setActiveTab] = useState("activity");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <ContactDetailHeader contact={contact} />

      {/* Content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-1">
          <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-[var(--bg-hover)]">
            Activity
          </TabsTrigger>
          <TabsTrigger value="deals" className="rounded-lg data-[state=active]:bg-[var(--bg-hover)]">
            Deals
            {deals.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 rounded-full text-xs">
                {deals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-[var(--bg-hover)]">
            Messages
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 rounded-full text-xs">
                {messages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-lg data-[state=active]:bg-[var(--bg-hover)]">
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <ActivityTimeline
            messages={messages}
            deals={deals}
            comments={comments}
          />
        </TabsContent>

        <TabsContent value="deals" className="mt-4">
          {deals.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              No deals linked to this contact
            </p>
          ) : (
            <div className="space-y-3">
              {deals.map((deal) => (
                <div
                  key={deal.id as string}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[var(--border-emphasis)]"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {String(deal.name)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {(deal.pipeline_stages as Record<string, unknown>) && (
                        <Badge
                          variant="secondary"
                          className="rounded-full text-xs"
                          style={{
                            backgroundColor: `${(deal.pipeline_stages as Record<string, unknown>).colour}20`,
                            color: (deal.pipeline_stages as Record<string, unknown>).colour as string,
                          }}
                        >
                          {String((deal.pipeline_stages as Record<string, unknown>).name)}
                        </Badge>
                      )}
                      {deal.won_at ? (
                        <Badge className="rounded-full text-xs bg-green-500/10 text-green-500">
                          Won
                        </Badge>
                      ) : null}
                      {deal.lost_at ? (
                        <Badge className="rounded-full text-xs bg-red-500/10 text-red-500">
                          Lost
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {new Intl.NumberFormat("en-GB", {
                      style: "currency",
                      currency: (deal.currency as string) || "GBP",
                      minimumFractionDigits: 0,
                    }).format((deal.value as number) ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              No messages yet
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl border border-[var(--border-default)] p-4 ${
                    msg.direction === "inbound"
                      ? "bg-[var(--bg-card)]"
                      : "bg-[var(--accent-primary)]/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full text-xs capitalize">
                        {msg.channel}
                      </Badge>
                      <span className="text-xs text-[var(--text-muted)]">
                        {msg.direction === "inbound" ? "Received" : "Sent"}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-hint)]">
                      {new Date(msg.timestamp).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {msg.subject && (
                    <p className="font-medium text-sm text-[var(--text-primary)] mb-1">
                      {msg.subject}
                    </p>
                  )}
                  <p className="text-sm text-[var(--text-secondary)]">
                    {msg.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <CommentSection contactId={contact.id} initialComments={comments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
