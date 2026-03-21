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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Check, X } from "lucide-react";
import {
  submitExpense,
  approveExpense,
  rejectExpense,
  type ActionState,
} from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";
import type { ExpenseCategory, ExpenseStatus } from "@/types/erp";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
} from "@/types/erp";

type ExpenseRow = {
  id: string;
  submitted_by: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  receipt_url: string | null;
  status: ExpenseStatus;
  rejection_reason: string | null;
  created_at: string;
  submitter: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

type Props = {
  initialExpenses: ExpenseRow[];
  orgId: string;
  userId: string;
  userRole: string;
};

const STATUS_STYLES: Record<ExpenseStatus, string> = {
  pending: "bg-[#EE6C29]/15 text-[#FAC09A]",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-destructive/15 text-destructive",
  reimbursed: "bg-[#7AA6B3]/15 text-[#9EC6D1]",
};

export function ExpensesClient({
  initialExpenses,
  orgId,
  userId,
  userRole,
}: Props) {
  const [expenses, setExpenses] = useState<ExpenseRow[]>(initialExpenses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mine" | "pending">("all");
  const canApprove = ["owner", "admin", "manager"].includes(userRole);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("expenses")
      .select(
        "*, submitter:profiles!expenses_submitted_by_fkey(id, full_name, avatar_url)"
      )
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setExpenses(data as unknown as ExpenseRow[]);
  }, [orgId]);

  const [createState, createAction, isCreating] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await submitExpense(prev, formData);
      if (result.success) {
        setDialogOpen(false);
        refresh();
      }
      return result;
    },
    {}
  );

  const handleApprove = async (id: string) => {
    await approveExpense(id);
    refresh();
  };

  const [rejectState, rejectAction, isRejecting] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await rejectExpense(prev, formData);
      if (result.success) {
        setRejectTarget(null);
        refresh();
      }
      return result;
    },
    {}
  );

  const filtered = expenses.filter((e) => {
    if (filter === "mine") return e.submitted_by === userId;
    if (filter === "pending") return e.status === "pending";
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Submit and manage expense claims
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Plus className="size-4" />
            Submit Expense
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Submit Expense</DialogTitle>
            </DialogHeader>
            <form action={createAction} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select name="category" required>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {EXPENSE_CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input
                  name="description"
                  required
                  placeholder="What was this expense for?"
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    name="expense_date"
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Input
                  name="currency"
                  defaultValue="GBP"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>Receipt URL (optional)</Label>
                <Input
                  name="receipt_url"
                  type="url"
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>
              {createState.error && (
                <p className="text-sm text-destructive">{createState.error}</p>
              )}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreating ? "Submitting..." : "Submit Expense"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "mine", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-[#3D4141] text-[#D4DADA] hover:bg-[#505555]"
            }`}
          >
            {f === "all" ? "All" : f === "mine" ? "My Expenses" : "Pending Review"}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {filter === "pending"
                ? "No expenses pending review."
                : "No expenses found."}
            </p>
          </div>
        ) : (
          filtered.map((exp) => (
            <div
              key={exp.id}
              className="bg-card border border-border rounded-xl p-4 transition-colors hover:border-[rgba(255,255,255,0.12)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {exp.description}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        STATUS_STYLES[exp.status]
                      }`}
                    >
                      {EXPENSE_STATUS_LABELS[exp.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {EXPENSE_CATEGORY_LABELS[exp.category]}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(exp.expense_date).toLocaleDateString()}
                    </span>
                    {exp.submitter?.full_name && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {exp.submitter.full_name}
                        </span>
                      </>
                    )}
                  </div>
                  {exp.status === "rejected" && exp.rejection_reason && (
                    <p className="text-xs text-destructive mt-1">
                      Rejection: {exp.rejection_reason}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-mono font-medium text-foreground">
                    {exp.currency} {Number(exp.amount).toFixed(2)}
                  </div>
                </div>

                {/* Approval Actions */}
                {canApprove && exp.status === "pending" && exp.submitted_by !== userId && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleApprove(exp.id)}
                      className="size-8 flex items-center justify-center rounded-full hover:bg-emerald-500/15 transition-colors"
                      title="Approve"
                    >
                      <Check className="size-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => setRejectTarget(exp.id)}
                      className="size-8 flex items-center justify-center rounded-full hover:bg-destructive/15 transition-colors"
                      title="Reject"
                    >
                      <X className="size-4 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
          </DialogHeader>
          <form action={rejectAction} className="space-y-4 mt-2">
            <input type="hidden" name="id" value={rejectTarget ?? ""} />
            <div className="space-y-1">
              <Label>Reason for Rejection</Label>
              <Input
                name="rejection_reason"
                required
                placeholder="Explain why this expense is being rejected"
                className="rounded-xl"
              />
            </div>
            {rejectState.error && (
              <p className="text-sm text-destructive">{rejectState.error}</p>
            )}
            <button
              type="submit"
              disabled={isRejecting}
              className="w-full rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {isRejecting ? "Rejecting..." : "Reject Expense"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
