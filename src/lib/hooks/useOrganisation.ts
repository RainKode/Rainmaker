"use client";

import { create } from "zustand";
import type { Role } from "@/types/auth";

type OrgState = {
  currentOrganisationId: string | null;
  currentRole: Role | null;
  currentWorkspaceId: string | null;
  setOrganisation: (orgId: string, role: Role) => void;
  setWorkspace: (workspaceId: string) => void;
  clear: () => void;
};

export const useOrganisationStore = create<OrgState>((set) => ({
  currentOrganisationId: null,
  currentRole: null,
  currentWorkspaceId: null,
  setOrganisation: (orgId, role) =>
    set({ currentOrganisationId: orgId, currentRole: role }),
  setWorkspace: (workspaceId) => set({ currentWorkspaceId: workspaceId }),
  clear: () =>
    set({
      currentOrganisationId: null,
      currentRole: null,
      currentWorkspaceId: null,
    }),
}));
