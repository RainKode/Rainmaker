"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { AuthActionState } from "@/lib/actions/auth";

export async function getOrganisation(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", orgId)
    .single();
  return data;
}

export async function updateOrganisation(
  orgId: string,
  updates: { name?: string; default_currency?: string; timezone?: string }
): Promise<AuthActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("organisations")
    .update(updates)
    .eq("id", orgId);

  if (error) return { error: error.message };
  return { success: "Organisation updated" };
}

export async function getMembers(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organisation_memberships")
    .select("*, profiles(full_name, email, avatar_url)")
    .eq("organisation_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function updateMemberRole(
  membershipId: string,
  role: string
): Promise<AuthActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organisation_memberships")
    .update({ role })
    .eq("id", membershipId);

  if (error) return { error: error.message };
  return { success: "Role updated" };
}

export async function removeMember(
  membershipId: string
): Promise<AuthActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organisation_memberships")
    .update({ is_active: false })
    .eq("id", membershipId);

  if (error) return { error: error.message };
  return { success: "Member removed" };
}

export async function getCurrentOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("current_org_id")?.value ?? null;
}
