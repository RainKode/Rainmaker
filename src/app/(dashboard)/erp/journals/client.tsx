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
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { createJournalEntry, type ActionState } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";
import { JOURNAL_SOURCE_LABELS } from "@/types/erp";
import type { JournalSource } from "@/types/erp";

type JournalEntryRow = {
  id: string;
  period_id: string;
  entry_date: string;
  reference: string | null;
  description: string;
  source: JournalSource;
  is_reversed: boolean;
  created_at: string;
  journal_entry_lines: {
    id: string;
    account_id: string;
    description: string | null;
    debit: number;
    credit: number;
    chart_of_accounts: { id: string; code: string; name: string } | null;
  }[];
};

type AccountOption = {
  id: string;
  code: string;
  name: string;
  account_type: string;
};

type PeriodOption = {
  id: string;
  name: string;
  status: string;
};

type LineInput = {
  account_id: string;
  description: string;
  debit: string;
  credit: string;
};

type Props = {
  initialEntries: JournalEntryRow[];
  periods: PeriodOption[];
  accounts: AccountOption[];
  orgId: string;
  userRole: string;
};

function JournalRow({ entry }: { entry: JournalEntryRow }) {
  const [expanded, setExpanded] = useState(false);
  const totalDebit = entry.journal_entry_lines.reduce((s, l) => s + Number(l.debit), 0);
  const totalCredit = entry.journal_entry_lines.reduce((s, l) => s + Number(l.credit), 0);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3 px-4 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs text-muted-foreground w-24 shrink-0">
          {new Date(entry.entry_date).toLocaleDateString()}
        </span>
        <span className="text-sm text-foreground flex-1 truncate">
          {entry.description}
        </span>
        {entry.reference && (
          <span className="text-xs text-muted-foreground font-mono">
            {entry.reference}
          </span>
        )}
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            entry.source === "manual"
              ? "bg-[#3D4141] text-[#D4DADA]"
              : entry.source === "auto"
              ? "bg-[#7AA6B3]/15 text-[#9EC6D1]"
              : "bg-[#EE6C29]/15 text-[#FAC09A]"
          }`}
        >
          {JOURNAL_SOURCE_LABELS[entry.source]}
        </span>
        <span className="text-sm font-mono text-muted-foreground w-24 text-right">
          {totalDebit.toFixed(2)}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 ml-8">
          <div className="bg-muted/30 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider border-b border-border">
              <span>Account</span>
              <span className="w-24 text-right">Debit</span>
              <span className="w-24 text-right">Credit</span>
            </div>
            {entry.journal_entry_lines.map((line) => (
              <div
                key={line.id}
                className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-sm border-b border-border last:border-b-0"
              >
                <div>
                  <span className="font-mono text-muted-foreground text-xs mr-2">
                    {line.chart_of_accounts?.code}
                  </span>
                  <span className="text-foreground">
                    {line.chart_of_accounts?.name}
                  </span>
                  {line.description && (
                    <span className="text-xs text-muted-foreground ml-2">
                      — {line.description}
                    </span>
                  )}
                </div>
                <span className="w-24 text-right font-mono">
                  {Number(line.debit) > 0 ? Number(line.debit).toFixed(2) : "—"}
                </span>
                <span className="w-24 text-right font-mono">
                  {Number(line.credit) > 0 ? Number(line.credit).toFixed(2) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function JournalsClient({
  initialEntries,
  periods,
  accounts,
  orgId,
  userRole,
}: Props) {
  const [entries, setEntries] = useState<JournalEntryRow[]>(initialEntries);
  const [dialogOpen, setDialogOpen] = useState(false);
  const canCreate = ["owner", "admin", "manager"].includes(userRole);
  const openPeriods = periods.filter((p) => p.status === "open");

  const [lines, setLines] = useState<LineInput[]>([
    { account_id: "", description: "", debit: "", credit: "" },
    { account_id: "", description: "", debit: "", credit: "" },
  ]);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const addLine = () =>
    setLines([...lines, { account_id: "", description: "", debit: "", credit: "" }]);

  const removeLine = (i: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, idx) => idx !== i));
  };

  const updateLine = (i: number, field: keyof LineInput, value: string) => {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    setLines(updated);
  };

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("journal_entries")
      .select("*, journal_entry_lines(*, chart_of_accounts(id, code, name))")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("entry_date", { ascending: false })
      .limit(50);
    if (data) setEntries(data as unknown as JournalEntryRow[]);
  }, [orgId]);

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      // Inject lines as JSON
      formData.set(
        "lines",
        JSON.stringify(
          lines
            .filter((l) => l.account_id)
            .map((l) => ({
              account_id: l.account_id,
              description: l.description || undefined,
              debit: l.debit || "0",
              credit: l.credit || "0",
            }))
        )
      );
      const result = await createJournalEntry(prev, formData);
      if (result.success) {
        setDialogOpen(false);
        setLines([
          { account_id: "", description: "", debit: "", credit: "" },
          { account_id: "", description: "", debit: "", credit: "" },
        ]);
        refresh();
      }
      return result;
    },
    {}
  );

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Journal Entries</h1>
          <p className="text-sm text-muted-foreground">
            Record and view double-entry transactions
          </p>
        </div>
        {canCreate && openPeriods.length > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Plus className="size-4" />
              New Entry
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Journal Entry</DialogTitle>
              </DialogHeader>
              <form action={formAction} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Period</Label>
                    <Select name="period_id" required>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {openPeriods.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input type="date" name="entry_date" required className="rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input name="description" required className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label>Reference (optional)</Label>
                    <Input name="reference" className="rounded-xl" />
                  </div>
                </div>

                {/* Lines */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Entry Lines</Label>
                    <button
                      type="button"
                      onClick={addLine}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      + Add Line
                    </button>
                  </div>

                  <div className="space-y-2">
                    {lines.map((line, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Select
                          value={line.account_id || undefined}
                          onValueChange={(v) => updateLine(i, "account_id", v ?? "")}
                        >
                          <SelectTrigger className="rounded-xl flex-1 min-w-0">
                            <SelectValue placeholder="Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.code} — {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Debit"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.debit}
                          onChange={(e) => updateLine(i, "debit", e.target.value)}
                          className="rounded-xl w-24"
                        />
                        <Input
                          placeholder="Credit"
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.credit}
                          onChange={(e) => updateLine(i, "credit", e.target.value)}
                          className="rounded-xl w-24"
                        />
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0 mt-0.5"
                          aria-label="Remove line"
                        >
                          <Trash2 className="size-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Balance indicator */}
                  <div className="flex items-center justify-end gap-4 text-xs pt-1">
                    <span className="text-muted-foreground">
                      Debits: <span className="font-mono text-foreground">{totalDebit.toFixed(2)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Credits: <span className="font-mono text-foreground">{totalCredit.toFixed(2)}</span>
                    </span>
                    <span
                      className={`font-medium ${
                        isBalanced ? "text-emerald-400" : "text-destructive"
                      }`}
                    >
                      {isBalanced ? "Balanced ✓" : "Unbalanced"}
                    </span>
                  </div>
                </div>

                {state.error && (
                  <p className="text-sm text-destructive">{state.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isPending || !isBalanced}
                  className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? "Posting..." : "Post Entry"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {openPeriods.length === 0 && canCreate && (
        <div className="bg-[#EE6C29]/10 border border-[#EE6C29]/20 rounded-xl p-3 text-sm text-[#FAC09A]">
          No open accounting periods. Create one in the Periods page before posting entries.
        </div>
      )}

      {/* Entries List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No journal entries yet.
          </div>
        ) : (
          entries.map((entry) => (
            <JournalRow key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
