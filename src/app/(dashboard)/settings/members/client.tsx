"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMemberRole, removeMember } from "@/lib/actions/organisation";
import { sendInvitations } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  user_id: string;
  role: string;
  profiles: { full_name: string | null; email: string; avatar_url: string | null } | null;
};

const ROLES = ["owner", "admin", "manager", "member", "guest"] as const;

export default function MembersClient({
  orgId,
  members,
}: {
  orgId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setMessage(null);

    const result = await sendInvitations(orgId, [
      { email: inviteEmail.trim(), role: inviteRole },
    ]);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Invitation sent");
      setInviteEmail("");
    }
    setInviting(false);
  }

  async function handleRoleChange(membershipId: string, newRole: string) {
    await updateMemberRole(membershipId, newRole);
    router.refresh();
  }

  async function handleRemove(membershipId: string) {
    await removeMember(membershipId);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="invite-email" className="text-sm font-medium">
            Invite by email
          </label>
          <input
            id="invite-email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="invite-role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="invite-role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring"
          >
            {ROLES.filter((r) => r !== "owner").map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={inviting}>
          {inviting ? "Sending…" : "Send invite"}
        </Button>
      </form>

      {message && (
        <p
          className={cn(
            "text-sm",
            message.startsWith("Invitation") ? "text-green-500" : "text-destructive"
          )}
        >
          {message}
        </p>
      )}

      {/* Members list */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Member</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {m.profiles?.full_name ?? "Unnamed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.profiles?.email}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {m.role === "owner" ? (
                    <span className="text-xs font-medium uppercase tracking-wider text-primary">
                      Owner
                    </span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="rounded-xl border border-border bg-background px-2 py-1 text-xs outline-none"
                    >
                      {ROLES.filter((r) => r !== "owner").map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(m.id)}
                      aria-label={`Remove ${m.profiles?.full_name ?? "member"}`}
                    >
                      <UserMinus className="size-4 text-destructive" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
