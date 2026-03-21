import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, GitBranch, Settings } from "lucide-react";

export default async function PipelinesPage() {
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

  const { data: pipelines } = await supabase
    .from("pipelines")
    .select("*, stages:pipeline_stages(id, name, colour, sort_order)")
    .eq("organisation_id", membership.organisation_id)
    .eq("is_active", true)
    .order("created_at");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
          <p className="text-sm text-muted-foreground">
            Manage your sales pipelines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/crm/pipelines/settings"
            className="inline-flex items-center gap-2 border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-medium rounded-full px-5 py-2.5 transition-colors min-h-[44px]"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>
      </div>

      {(!pipelines || pipelines.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GitBranch className="size-10 text-[var(--text-hint)] mb-3" />
          <p className="text-lg font-medium text-[var(--text-secondary)]">
            No pipelines
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            A default pipeline is created when your organisation is set up
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => {
            const stages = (
              pipeline.stages as { id: string; name: string; colour: string; sort_order: number }[]
            )?.sort((a, b) => a.sort_order - b.sort_order) ?? [];

            return (
              <Link
                key={pipeline.id}
                href={`/crm/pipelines/${pipeline.id}`}
                className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--border-emphasis)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {pipeline.name}
                    </p>
                    {pipeline.description && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                        {pipeline.description}
                      </p>
                    )}
                  </div>
                  {pipeline.is_default && (
                    <span className="text-xs text-[var(--accent-primary)] font-medium">
                      Default
                    </span>
                  )}
                </div>

                {/* Stage preview bar */}
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                  {stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="flex-1 rounded-full"
                      style={{ backgroundColor: stage.colour }}
                      title={stage.name}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {stages.length > 0 && (
                    <>
                      <span className="text-[10px] text-[var(--text-hint)]">
                        {stages[0].name}
                      </span>
                      <span className="text-[10px] text-[var(--text-hint)]">
                        {stages[stages.length - 1].name}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
