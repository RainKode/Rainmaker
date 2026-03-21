"use client";

import { useMemo, useState } from "react";
import type { AccountType, TrialBalanceRow, ProfitLossRow, ARAgeing } from "@/types/erp";
import { ACCOUNT_TYPE_LABELS } from "@/types/erp";

// ─── Types ──────────────────────────────────────────────────────────────────

type AccountRow = {
  id: string;
  code: string;
  name: string;
  account_type: AccountType;
  normal_balance: "debit" | "credit";
  is_active: boolean;
};

type PeriodRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
};

type JournalLineRow = {
  account_id: string;
  debit: number;
  credit: number;
  journal_entry: {
    entry_date: string;
    organisation_id: string;
    is_active: boolean;
  };
};

type InvoiceRow = {
  id: string;
  contact_id: string | null;
  invoice_number: string;
  due_date: string;
  amount_due: number;
  status: string;
  currency: string;
};

type ContactRow = {
  id: string;
  first_name: string;
  last_name: string;
};

type Props = {
  accounts: AccountRow[];
  periods: PeriodRow[];
  journalLines: JournalLineRow[];
  invoices: InvoiceRow[];
  contacts: ContactRow[];
  userRole: string;
};

type ReportTab = "trial-balance" | "profit-loss" | "ar-ageing";

// ─── Component ──────────────────────────────────────────────────────────────

export function ReportsClient({
  accounts,
  periods,
  journalLines,
  invoices,
  contacts,
}: Props) {
  const [tab, setTab] = useState<ReportTab>("trial-balance");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Filter lines by selected period date range
  const filteredLines = useMemo(() => {
    if (selectedPeriod === "all") return journalLines;
    const period = periods.find((p) => p.id === selectedPeriod);
    if (!period) return journalLines;
    return journalLines.filter((l) => {
      const d = l.journal_entry.entry_date;
      return d >= period.start_date && d <= period.end_date;
    });
  }, [journalLines, selectedPeriod, periods]);

  // ─── Trial Balance ────────────────────────────────────────────────────────

  const trialBalance = useMemo((): TrialBalanceRow[] => {
    const map = new Map<string, { debit: number; credit: number }>();
    for (const line of filteredLines) {
      const cur = map.get(line.account_id) ?? { debit: 0, credit: 0 };
      cur.debit += Number(line.debit) || 0;
      cur.credit += Number(line.credit) || 0;
      map.set(line.account_id, cur);
    }
    return accounts
      .filter((a) => map.has(a.id))
      .map((a) => {
        const totals = map.get(a.id)!;
        return {
          account_id: a.id,
          account_code: a.code,
          account_name: a.name,
          account_type: a.account_type,
          debit_total: totals.debit,
          credit_total: totals.credit,
          balance:
            a.normal_balance === "debit"
              ? totals.debit - totals.credit
              : totals.credit - totals.debit,
        };
      })
      .sort((a, b) => a.account_code.localeCompare(b.account_code));
  }, [accounts, filteredLines]);

  const tbDebitSum = trialBalance.reduce((s, r) => s + r.debit_total, 0);
  const tbCreditSum = trialBalance.reduce((s, r) => s + r.credit_total, 0);

  // ─── Profit & Loss ───────────────────────────────────────────────────────

  const profitLoss = useMemo((): ProfitLossRow[] => {
    const map = new Map<string, number>();
    for (const line of filteredLines) {
      const amount = (Number(line.debit) || 0) - (Number(line.credit) || 0);
      map.set(line.account_id, (map.get(line.account_id) ?? 0) + amount);
    }
    return accounts
      .filter(
        (a) =>
          (a.account_type === "revenue" || a.account_type === "expense") &&
          map.has(a.id)
      )
      .map((a) => ({
        account_id: a.id,
        account_code: a.code,
        account_name: a.name,
        account_type: a.account_type as "revenue" | "expense",
        total:
          a.account_type === "revenue"
            ? -(map.get(a.id) ?? 0) // Revenue is credit-normal, so flip
            : map.get(a.id) ?? 0,
      }))
      .sort((a, b) => a.account_code.localeCompare(b.account_code));
  }, [accounts, filteredLines]);

  const totalRevenue = profitLoss
    .filter((r) => r.account_type === "revenue")
    .reduce((s, r) => s + r.total, 0);

  const totalExpenses = profitLoss
    .filter((r) => r.account_type === "expense")
    .reduce((s, r) => s + r.total, 0);

  const netIncome = totalRevenue - totalExpenses;

  // ─── AR Ageing ────────────────────────────────────────────────────────────

  const arAgeing = useMemo((): ARAgeing[] => {
    const contactMap = new Map<string, ContactRow>();
    for (const c of contacts) contactMap.set(c.id, c);

    const now = new Date();
    const buckets = new Map<
      string,
      { current: number; days_31_60: number; days_61_90: number; over_90: number; total: number }
    >();

    for (const inv of invoices) {
      if (!inv.contact_id || Number(inv.amount_due) <= 0) continue;
      const due = new Date(inv.due_date);
      const daysPast = Math.max(
        0,
        Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
      );
      const amount = Number(inv.amount_due);

      const cur = buckets.get(inv.contact_id) ?? {
        current: 0,
        days_31_60: 0,
        days_61_90: 0,
        over_90: 0,
        total: 0,
      };

      if (daysPast <= 30) cur.current += amount;
      else if (daysPast <= 60) cur.days_31_60 += amount;
      else if (daysPast <= 90) cur.days_61_90 += amount;
      else cur.over_90 += amount;

      cur.total += amount;
      buckets.set(inv.contact_id, cur);
    }

    return Array.from(buckets.entries())
      .map(([contactId, b]) => {
        const c = contactMap.get(contactId);
        return {
          contact_id: contactId,
          contact_name: c ? `${c.first_name} ${c.last_name}`.trim() : "Unknown",
          ...b,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [invoices, contacts]);

  const arTotals = arAgeing.reduce(
    (t, r) => ({
      current: t.current + r.current,
      days_31_60: t.days_31_60 + r.days_31_60,
      days_61_90: t.days_61_90 + r.days_61_90,
      over_90: t.over_90 + r.over_90,
      total: t.total + r.total,
    }),
    { current: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 0 }
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  const TABS: { key: ReportTab; label: string }[] = [
    { key: "trial-balance", label: "Trial Balance" },
    { key: "profit-loss", label: "Profit & Loss" },
    { key: "ar-ageing", label: "AR Ageing" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">
          View trial balance, profit &amp; loss, and accounts receivable ageing
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-[#3D4141] text-[#D4DADA] hover:bg-[#505555]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period Selector (for TB and P&L) */}
      {tab !== "ar-ageing" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-xl bg-card border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All time</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ─── Trial Balance ─────────────────────────────────────────────── */}
      {tab === "trial-balance" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Account</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Debit</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Credit</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No journal entries for the selected period.
                  </td>
                </tr>
              ) : (
                <>
                  {trialBalance.map((row) => (
                    <tr
                      key={row.account_id}
                      className="border-b border-border last:border-0 hover:bg-[#3D4141]/50"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{row.account_code}</td>
                      <td className="px-4 py-2">{row.account_name}</td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-muted-foreground">
                          {ACCOUNT_TYPE_LABELS[row.account_type]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.debit_total > 0 ? row.debit_total.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.credit_total > 0 ? row.credit_total.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-medium">
                        {row.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-[#3D4141]/30">
                    <td colSpan={3} className="px-4 py-2 font-medium">Totals</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {tbDebitSum.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {tbCreditSum.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {Math.abs(tbDebitSum - tbCreditSum) < 0.01 ? (
                        <span className="text-xs font-medium text-emerald-400">Balanced</span>
                      ) : (
                        <span className="text-xs font-medium text-destructive">
                          Off by {Math.abs(tbDebitSum - tbCreditSum).toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Profit & Loss ─────────────────────────────────────────── */}
      {tab === "profit-loss" && (
        <div className="space-y-4">
          {/* Revenue */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Revenue</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {profitLoss
                  .filter((r) => r.account_type === "revenue")
                  .map((row) => (
                    <tr
                      key={row.account_id}
                      className="border-b border-border last:border-0 hover:bg-[#3D4141]/50"
                    >
                      <td className="px-4 py-2 font-mono text-xs w-20">{row.account_code}</td>
                      <td className="px-4 py-2">{row.account_name}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                <tr className="bg-[#3D4141]/30">
                  <td colSpan={2} className="px-4 py-2 font-medium">Total Revenue</td>
                  <td className="px-4 py-2 text-right font-mono font-medium text-emerald-400">
                    {totalRevenue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Expenses */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Expenses</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {profitLoss
                  .filter((r) => r.account_type === "expense")
                  .map((row) => (
                    <tr
                      key={row.account_id}
                      className="border-b border-border last:border-0 hover:bg-[#3D4141]/50"
                    >
                      <td className="px-4 py-2 font-mono text-xs w-20">{row.account_code}</td>
                      <td className="px-4 py-2">{row.account_name}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                <tr className="bg-[#3D4141]/30">
                  <td colSpan={2} className="px-4 py-2 font-medium">Total Expenses</td>
                  <td className="px-4 py-2 text-right font-mono font-medium text-[#FAC09A]">
                    {totalExpenses.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Income */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Net Income</span>
            <span
              className={`text-lg font-mono font-bold ${
                netIncome >= 0 ? "text-emerald-400" : "text-destructive"
              }`}
            >
              {netIncome >= 0 ? "" : "−"}{Math.abs(netIncome).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ─── AR Ageing ────────────────────────────────────────────── */}
      {tab === "ar-ageing" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Current</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">31-60</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">61-90</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">90+</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {arAgeing.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No outstanding receivables.
                  </td>
                </tr>
              ) : (
                <>
                  {arAgeing.map((row) => (
                    <tr
                      key={row.contact_id}
                      className="border-b border-border last:border-0 hover:bg-[#3D4141]/50"
                    >
                      <td className="px-4 py-2 font-medium">{row.contact_name}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.current > 0 ? row.current.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.days_31_60 > 0 ? row.days_31_60.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.days_61_90 > 0 ? row.days_61_90.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {row.over_90 > 0 ? (
                          <span className="text-destructive">{row.over_90.toFixed(2)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-medium">
                        {row.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-[#3D4141]/30">
                    <td className="px-4 py-2 font-medium">Totals</td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {arTotals.current.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {arTotals.days_31_60.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {arTotals.days_61_90.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {arTotals.over_90.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium">
                      {arTotals.total.toFixed(2)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
