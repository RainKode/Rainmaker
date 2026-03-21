import { getCurrentOrgId } from "@/lib/actions/organisation";
import { getWorkspaces } from "@/lib/actions/workspaces";
import { redirect } from "next/navigation";
import WorkspacesClient from "./client";

export default async function WorkspacesPage() {
  const orgId = await getCurrentOrgId();
  if (!orgId) redirect("/onboarding");

  const workspaces = await getWorkspaces(orgId);

  return <WorkspacesClient orgId={orgId} workspaces={workspaces} />;
}
