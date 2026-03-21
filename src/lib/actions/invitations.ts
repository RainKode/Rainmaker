"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/actions/auth";

export async function acceptInvitation(token: string): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in first" };
  }

  // Look up invitation
  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (fetchError || !invitation) {
    return { error: "Invitation not found" };
  }

  if (invitation.status === "accepted") {
    return { error: "This invitation has already been accepted" };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from("invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return { error: "This invitation has expired" };
  }

  // Check email matches
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (profile?.email !== invitation.email) {
    return {
      error: `This invitation was sent to ${invitation.email}. Please sign in with that email.`,
    };
  }

  // Check not already a member
  const { data: existingMembership } = await supabase
    .from("organisation_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("organisation_id", invitation.organisation_id)
    .single();

  if (existingMembership) {
    // Already a member — just mark invitation accepted and redirect
    await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);
    redirect("/dashboard");
  }

  // Create membership
  const { error: memberError } = await supabase
    .from("organisation_memberships")
    .insert({
      user_id: user.id,
      organisation_id: invitation.organisation_id,
      role: invitation.role,
    });

  if (memberError) {
    return { error: memberError.message };
  }

  // Mark invitation accepted
  await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  // Set org cookie
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("current_org_id", invitation.organisation_id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}
