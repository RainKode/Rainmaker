"use client";

import { useState } from "react";
import { updateOrganisation } from "@/lib/actions/organisation";
import { Button } from "@/components/ui/button";

type Org = {
  id: string;
  name: string;
  slug: string;
  default_currency: string;
  timezone: string | null;
};

export default function OrgSettingsForm({ org }: { org: Org }) {
  const [name, setName] = useState(org.name);
  const [currency, setCurrency] = useState(org.default_currency);
  const [timezone, setTimezone] = useState(org.timezone ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const result = await updateOrganisation(org.id, {
      name,
      default_currency: currency,
      timezone: timezone || undefined,
    });

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Saved");
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="org-name" className="text-sm font-medium">
          Organisation name
        </label>
        <input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="org-slug" className="text-sm font-medium">
          Slug
        </label>
        <input
          id="org-slug"
          value={org.slug}
          disabled
          className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">Slug cannot be changed.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="org-currency" className="text-sm font-medium">
          Default currency
        </label>
        <input
          id="org-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="org-timezone" className="text-sm font-medium">
          Timezone
        </label>
        <input
          id="org-timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="e.g. Asia/Kolkata"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring placeholder:text-muted-foreground"
        />
      </div>

      {message && (
        <p
          className={
            message === "Saved"
              ? "text-sm text-green-500"
              : "text-sm text-destructive"
          }
        >
          {message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
