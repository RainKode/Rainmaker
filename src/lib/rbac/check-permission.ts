import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac/permissions";
import type { Permission } from "@/types/auth";

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Check if the current user has a specific permission in the given organisation.
 * Throws ForbiddenError if the user lacks the permission.
 */
export async function checkPermission(
  orgId: string,
  permission: Permission
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ForbiddenError("Not authenticated");
  }

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("organisation_id", orgId)
    .eq("is_active", true)
    .single();

  if (!membership) {
    throw new ForbiddenError("Not a member of this organisation");
  }

  const role = membership.role as import("@/types/auth").Role;

  if (!hasPermission(role, permission)) {
    throw new ForbiddenError();
  }
}

/**
 * Get the current user's role in an organisation. Returns null if not a member.
 */
export async function getUserRole(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("organisation_id", orgId)
    .eq("is_active", true)
    .single();

  return (membership?.role as import("@/types/auth").Role) ?? null;
}
