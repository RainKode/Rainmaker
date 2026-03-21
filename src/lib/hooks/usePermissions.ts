"use client";

import { useOrganisationStore } from "@/lib/hooks/useOrganisation";
import { hasPermission } from "@/lib/rbac/permissions";
import type { Permission, Role } from "@/types/auth";

export function usePermissions() {
  const role = useOrganisationStore((s) => s.currentRole);

  return {
    role,
    can: (permission: Permission): boolean => {
      if (!role) return false;
      return hasPermission(role, permission);
    },
    isAtLeast: (minRole: Role): boolean => {
      if (!role) return false;
      const hierarchy: Role[] = ["owner", "admin", "manager", "member", "guest"];
      return hierarchy.indexOf(role) <= hierarchy.indexOf(minRole);
    },
  };
}
