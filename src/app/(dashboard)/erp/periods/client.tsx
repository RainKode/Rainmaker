"use client";

import { useActionState, useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Lock, Unlock, Archive } from "lucide-react";
import { createPeriod, updatePeriodStatus, type ActionState } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";
import type { AccountingPeriod, PeriodStatus } from "@/types/erp";
import { PERIOD_STATUS_LABELS } from "@/types/erp";

type Props = {
  initialPeriods: AccountingPeriod[];
  orgId: string;
  userRole: string;
};

const STATUS_STYLES: Record<PeriodStatus, string> = {
  open: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-[#3D4141] text-[#D4DADA]",
  locked: "bg-[#EE6C29]/15 text-[#FAC09A]",
};

export function PeriodsClient({ initialPeriods, orgId, userRole }: Props) {
  const [periods, setPeriods] = useState<AccountingPeriod[]>(initialPeriods);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAdmin = ["owner", "admin"].includes(userRole);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("accounting_periods")
      .select("*")
      .eq("organisation_id", orgId)
      .order("start_date", { ascending: false });
    if (data) setPeriods(data as AccountingPeriod[]);
  }, [orgId]);

  const [createState, createAction, isCreating] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createPeriod(prev, formData);
      if (result.success) {
        setDialogOpen(false);
        refresh();
      }
      return result;
    },
    {}
  );

  const handleStatusChange = async (id: string, status: PeriodStatus) => {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", status);
    await updatePeriodStatus({}, formData);
    refresh();
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Accounting Periods</h1>
          <p className="text-sm text-muted-foreground">
            Manage financial reporting periods
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Plus className="size-4" />
              New Period
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Accounting Period</DialogTitle>
              </DialogHeader>
              <form action={createAction} className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    name="name"
                    required
                    placeholder="e.g. Q1 2026"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Start Date</Label>
                    <Input type="date" name="start_date" required className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input type="date" name="end_date" required className="rounded-xl" />
                  </div>
                </div>
                {createState.error && (
                  <p className="text-sm text-destructive">{createState.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Period"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Periods List */}
      <div className="space-y-3">
        {periods.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No accounting periods yet. Create one to start posting journal entries.
            </p>
          </div>
        ) : (
          periods.map((period) => (
            <div
              key={period.id}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 transition-colors hover:border-[rgba(255,255,255,0.12)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {period.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_STYLES[period.status]
                    }`}
                  >
                    {PERIOD_STATUS_LABELS[period.status]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(period.start_date).toLocaleDateString()} —{" "}
                  {new Date(period.end_date).toLocaleDateString()}
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1">
                  {period.status === "open" && (
                    <button
                      onClick={() => handleStatusChange(period.id, "closed")}
                      className="size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                      aria-label="Close period"
                      title="Close period"
                    >
                      <Archive className="size-3.5 text-muted-foreground" />
                    </button>
                  )}
                  {period.status === "closed" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(period.id, "open")}
                        className="size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                        aria-label="Reopen period"
                        title="Reopen period"
                      >
                        <Unlock className="size-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(period.id, "locked")}
                        className="size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                        aria-label="Lock period"
                        title="Lock period"
                      >
                        <Lock className="size-3.5 text-[#EE6C29]" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
