"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOrgSchema, inviteMemberSchema } from "@/lib/validations/auth";
import type { AuthActionState } from "@/lib/actions/auth";

export async function createOrganisation(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = createOrgSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("organisations")
    .select("id")
    .eq("slug", parsed.data.slug)
    .single();

  if (existing) {
    return { error: "This slug is already taken" };
  }

  // Create organisation
  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      default_currency: parsed.data.default_currency,
      timezone: parsed.data.timezone,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { error: orgError?.message ?? "Failed to create organisation" };
  }

  // Create owner membership
  const { error: memberError } = await supabase
    .from("organisation_memberships")
    .insert({
      user_id: user.id,
      organisation_id: org.id,
      role: "owner",
    });

  if (memberError) {
    return { error: memberError.message };
  }

  return { success: org.id };
}

export async function sendInvitations(
  orgId: string,
  invites: Array<{ email: string; role: string }>
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const validated = invites.map((inv) => inviteMemberSchema.safeParse(inv));
  const invalid = validated.find((v) => !v.success);
  if (invalid && !invalid.success) {
    return { error: invalid.error.issues[0].message };
  }

  const rows = invites.map((inv) => ({
    email: inv.email,
    organisation_id: orgId,
    role: inv.role,
    invited_by: user.id,
  }));

  const { error } = await supabase.from("invitations").insert(rows);

  if (error) {
    return { error: error.message };
  }

  // TODO: Send invitation emails via Resend once configured
  return { success: "Invitations sent" };
}

export async function completeOnboarding(orgId: string) {
  // Set a cookie so middleware knows the active org
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("current_org_id", orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  redirect("/dashboard");
}
