import { getCurrentOrgId, getMembers } from "@/lib/actions/organisation";
import { redirect } from "next/navigation";
import MembersClient from "./client";

export default async function MembersPage() {
  const orgId = await getCurrentOrgId();
  if (!orgId) redirect("/onboarding");

  const members = await getMembers(orgId);

  return <MembersClient orgId={orgId} members={members} />;
}
