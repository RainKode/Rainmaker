import { createClient } from "@/lib/supabase/server";
import {
  ListChecks,
  Users,
  DollarSign,
  UserPlus,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";

async function getTaskStats(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, status, priority, is_active")
    .eq("organisation_id", orgId)
    .eq("is_active", true);

  if (!tasks) return { total: 0, completed: 0, inProgress: 0, overdue: 0, byPriority: {} as Record<string, number> };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const byPriority: Record<string, number> = {};
  for (const t of tasks) {
    byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
  }

  return { total, completed, inProgress, overdue: 0, byPriority };
}

async function getProjectStats(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", orgId)
    .eq("is_active", true);
  return count ?? 0;
}

async function getMemberCount(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const { count } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", orgId);
  return count ?? 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "there";

  // Get org context
  const orgId = user?.user_metadata?.organisation_id;
  const taskStats = orgId ? await getTaskStats(supabase, orgId) : null;
  const projectCount = orgId ? await getProjectStats(supabase, orgId) : 0;
  const memberCount = orgId ? await getMemberCount(supabase, orgId) : 0;

  const completionRate = taskStats && taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  const KPI_CARDS = [
    {
      label: "Total Tasks",
      value: taskStats?.total.toString() ?? "0",
      icon: ListChecks,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "In Progress",
      value: taskStats?.inProgress.toString() ?? "0",
      icon: Clock,
      color: "text-[#7AA6B3]",
      bgColor: "bg-[#7AA6B3]/10",
    },
    {
      label: "Completed",
      value: taskStats?.completed.toString() ?? "0",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      label: "Team Members",
      value: memberCount.toString(),
      icon: Users,
      color: "text-[#9EC6D1]",
      bgColor: "bg-[#9EC6D1]/10",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="space-y-1 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Here&apos;s what&apos;s happening across your workspace.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((kpi, i) => (
          <div
            key={kpi.label}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80 animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {kpi.label}
              </p>
              <div
                className={`flex size-8 items-center justify-center rounded-full ${kpi.bgColor}`}
              >
                <kpi.icon
                  className={`size-4 ${kpi.color}`}
                  aria-hidden="true"
                />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground tabular-nums">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Progress row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Task completion */}
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Task Progress</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {taskStats?.completed ?? 0}/{taskStats?.total ?? 0} done
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out animate-progress-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {completionRate}% completion rate
          </p>

          {/* Priority breakdown */}
          {taskStats && taskStats.total > 0 && (
            <div className="mt-4 flex items-center gap-4">
              {[
                { key: "critical", label: "Critical", color: "bg-[#EE6C29]" },
                { key: "high", label: "High", color: "bg-[#EE6C29]/60" },
                { key: "medium", label: "Medium", color: "bg-[#7AA6B3]" },
                { key: "low", label: "Low", color: "bg-[#505555]" },
              ].map((p) => (
                <div key={p.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`size-2 rounded-full ${p.color}`} />
                  <span>{taskStats.byPriority[p.key] ?? 0} {p.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects overview */}
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <Link
              href="/tasks"
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              View all <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
              <FolderKanban className="size-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{projectCount}</p>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="size-4 text-secondary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">
              Recent Activity
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
              <Activity className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Activity feed will appear here once modules are active.
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-in-up" style={{ animationDelay: "360ms" }}>
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              { label: "Create a task", href: "/tasks/board", icon: ListChecks },
              { label: "View board", href: "/tasks/board", icon: FolderKanban },
              { label: "Team settings", href: "/settings/members", icon: Users },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted min-h-[44px] press-scale"
              >
                <action.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
