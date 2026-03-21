import { getCurrentOrgId, getOrganisation } from "@/lib/actions/organisation";
import { redirect } from "next/navigation";
import OrgSettingsForm from "./form";

export default async function OrganisationSettingsPage() {
  const orgId = await getCurrentOrgId();
  if (!orgId) redirect("/onboarding");

  const org = await getOrganisation(orgId);
  if (!org) redirect("/onboarding");

  return <OrgSettingsForm org={org} />;
}
