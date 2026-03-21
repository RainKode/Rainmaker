import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ContactDetailClient } from "./client";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!membership) redirect("/onboarding");

  const orgId = membership.organisation_id;

  // Fetch contact with relations
  const { data: contact, error } = await supabase
    .from("contacts")
    .select(
      `*, company:companies(id, name, domain), pipeline_stage:pipeline_stages(id, name, colour), owner:profiles!contacts_owner_id_fkey(id, full_name, avatar_url)`
    )
    .eq("id", id)
    .single();

  if (error || !contact) notFound();

  // Fetch deals, messages, and comments in parallel
  const [dealsRes, messagesRes, commentsRes] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, name, value, currency, stage_id, won_at, lost_at, is_active, pipeline_stages(name, colour)"
      )
      .eq("contact_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("*")
      .eq("contact_id", id)
      .order("timestamp", { ascending: false })
      .limit(50),
    supabase
      .from("contact_comments")
      .select("*, user:profiles(full_name, avatar_url)")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ContactDetailClient
      contact={contact}
      deals={dealsRes.data ?? []}
      messages={messagesRes.data ?? []}
      comments={commentsRes.data ?? []}
      orgId={orgId}
    />
  );
}
