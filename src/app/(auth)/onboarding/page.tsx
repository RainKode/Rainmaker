"use client";

import { useState, useActionState } from "react";
import { createOrganisation, sendInvitations, completeOnboarding } from "@/lib/actions/onboarding";
import type { AuthActionState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Plus, X, ArrowRight } from "lucide-react";

const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const CURRENCIES = ["GBP", "USD", "EUR", "AED", "INR", "AUD", "CAD", "SGD"];

type InviteRow = { email: string; role: string };

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([
    { email: "", role: "member" },
  ]);

  // Step 1: Create org
  const [orgState, orgAction, orgPending] = useActionState<AuthActionState, FormData>(
    async (_prev, formData) => {
      const result = await createOrganisation(_prev, formData);
      if (result.success) {
        setOrgId(result.success);
        setStep(2);
      }
      return result;
    },
    {}
  );

  // Step 2: Send invites
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitePending, setInvitePending] = useState(false);

  const handleSendInvites = async () => {
    if (!orgId) return;
    const validInvites = invites.filter((inv) => inv.email.trim());
    if (validInvites.length === 0) {
      await completeOnboarding(orgId);
      return;
    }
    setInvitePending(true);
    const result = await sendInvitations(orgId, validInvites);
    setInvitePending(false);
    if (result.error) {
      setInviteError(result.error);
      return;
    }
    setStep(3);
  };

  const addInviteRow = () =>
    setInvites((prev) => [...prev, { email: "", role: "member" }]);

  const removeInviteRow = (idx: number) =>
    setInvites((prev) => prev.filter((_, i) => i !== idx));

  const updateInviteRow = (idx: number, field: keyof InviteRow, value: string) =>
    setInvites((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const INPUT_CLASS =
    "w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

  const SELECT_CLASS =
    "w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring";

  // ────────────────────────── Step 1 ──────────────────────────
  if (step === 1) {
    return (
      <AuthCard
        title="Create your organisation"
        description="Set up your workspace to get started"
      >
        <form action={orgAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Organisation name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Acme Corp"
              className={INPUT_CLASS}
              onChange={(e) => {
                const slugInput = document.getElementById(
                  "slug"
                ) as HTMLInputElement;
                if (slugInput) slugInput.value = slugify(e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium">
              URL slug
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              placeholder="acme-corp"
              pattern="^[a-z0-9-]+$"
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="default_currency" className="text-sm font-medium">
                Currency
              </label>
              <select
                id="default_currency"
                name="default_currency"
                className={SELECT_CLASS}
                defaultValue="GBP"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="timezone" className="text-sm font-medium">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                className={SELECT_CLASS}
                defaultValue="UTC"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {orgState.error && (
            <p className="text-sm text-destructive" role="alert">{orgState.error}</p>
          )}

          <Button type="submit" className="w-full rounded-full h-10" disabled={orgPending}>
            {orgPending ? "Creating\u2026" : "Create organisation"}
          </Button>
        </form>
      </AuthCard>
    );
  }

  // ────────────────────────── Step 2 ──────────────────────────
  if (step === 2) {
    return (
      <AuthCard
        title="Invite your team"
        description="Add team members or skip for now"
      >
        <div className="space-y-3">
          {invites.map((inv, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="colleague@example.com"
                value={inv.email}
                onChange={(e) =>
                  updateInviteRow(idx, "email", e.target.value)
                }
                className={`flex-1 ${INPUT_CLASS}`}
              />
              <select
                value={inv.role}
                onChange={(e) =>
                  updateInviteRow(idx, "role", e.target.value)
                }
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
                <option value="guest">Guest</option>
              </select>
              {invites.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInviteRow(idx)}
                  className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Remove invite"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full rounded-full h-10"
          onClick={addInviteRow}
        >
          <Plus className="mr-2 size-4" aria-hidden="true" />
          Add another
        </Button>

        {inviteError && (
          <p className="text-sm text-destructive" role="alert">{inviteError}</p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full h-10"
            onClick={() => orgId && completeOnboarding(orgId)}
            disabled={invitePending}
          >
            Skip
          </Button>
          <Button
            className="flex-1 rounded-full h-10"
            onClick={handleSendInvites}
            disabled={invitePending}
          >
            {invitePending ? "Sending\u2026" : "Send invites"}
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Button>
        </div>
      </AuthCard>
    );
  }

  // ────────────────────────── Step 3 ──────────────────────────
  return (
    <AuthCard
      title="You're all set!"
      description="Your organisation is ready. Invitations have been sent."
    >
      <Button
        className="w-full rounded-full h-10"
        onClick={() => orgId && completeOnboarding(orgId)}
      >
        Go to Dashboard
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </AuthCard>
  );
}
