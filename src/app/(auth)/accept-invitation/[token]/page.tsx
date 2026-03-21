import { createClient } from "@/lib/supabase/server";
import AcceptInvitationClient from "./client";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function AcceptInvitationPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Look up invitation
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*, organisations(name)")
    .eq("token", token)
    .single();

  if (!invitation) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Invalid invitation</h1>
        <p className="text-sm text-muted-foreground">
          This invitation link is invalid or has been revoked.
        </p>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Already accepted</h1>
        <p className="text-sm text-muted-foreground">
          This invitation has already been accepted.
        </p>
      </div>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Invitation expired</h1>
        <p className="text-sm text-muted-foreground">
          This invitation has expired. Please ask the organisation admin to resend it.
        </p>
      </div>
    );
  }

  const orgName = (invitation.organisations as { name: string } | null)?.name ?? "an organisation";

  return (
    <AcceptInvitationClient
      token={token}
      orgName={orgName}
      role={invitation.role}
      email={invitation.email}
      isLoggedIn={!!user}
    />
  );
}
