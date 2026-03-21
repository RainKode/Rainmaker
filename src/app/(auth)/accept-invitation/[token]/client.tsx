"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInvitation } from "@/lib/actions/invitations";
import { Button } from "@/components/ui/button";

type Props = {
  token: string;
  orgName: string;
  role: string;
  email: string;
  isLoggedIn: boolean;
};

export default function AcceptInvitationClient({
  token,
  orgName,
  role,
  email,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setPending(true);
    setError(null);
    const result = await acceptInvitation(token);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
    // On success the server action redirects
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">You&apos;re invited!</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ve been invited to join <strong>{orgName}</strong> as{" "}
          <strong>{role}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">
          Sign in or create an account with <strong>{email}</strong> to accept.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() =>
              router.push(`/login?redirect=/accept-invitation/${token}`)
            }
          >
            Sign in
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/register?redirect=/accept-invitation/${token}`)
            }
          >
            Create account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
      <h1 className="text-2xl font-bold">Join {orgName}</h1>
      <p className="text-sm text-muted-foreground">
        You&apos;ve been invited to join as <strong>{role}</strong>.
      </p>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button onClick={handleAccept} disabled={pending} className="w-full">
        {pending ? "Accepting…" : "Accept invitation"}
      </Button>
    </div>
  );
}
