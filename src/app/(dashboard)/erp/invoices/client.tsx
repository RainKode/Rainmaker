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
import { Plus, Trash2, Send, Ban, CreditCard } from "lucide-react";
import {
  createInvoice,
  updateInvoiceStatus,
  recordPayment,
  type ActionState,
} from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";
import type { InvoiceStatus } from "@/types/erp";
import { INVOICE_STATUS_LABELS } from "@/types/erp";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  contact_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  created_at: string;
  invoice_line_items: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
};

type ContactOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
};

type LineInput = {
  description: string;
  quantity: string;
  unit_price: string;
};

type Props = {
  initialInvoices: InvoiceRow[];
  contacts: ContactOption[];
  orgId: string;
  userRole: string;
};

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-[#3D4141] text-[#D4DADA]",
  sent: "bg-[#7AA6B3]/15 text-[#9EC6D1]",
  paid: "bg-emerald-500/15 text-emerald-400",
  overdue: "bg-[#EE6C29]/15 text-[#FAC09A]",
  voided: "bg-destructive/15 text-destructive",
  partially_paid: "bg-[#D45A1E]/15 text-[#FAC09A]",
};

export function InvoicesClient({
  initialInvoices,
  contacts,
  orgId,
  userRole,
}: Props) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>(initialInvoices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payDialogInvoice, setPayDialogInvoice] = useState<InvoiceRow | null>(null);
  const canManage = ["owner", "admin", "manager"].includes(userRole);

  const [lineItems, setLineItems] = useState<LineInput[]>([
    { description: "", quantity: "1", unit_price: "" },
  ]);

  const subtotal = lineItems.reduce(
    (s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0),
    0
  );

  const addLineItem = () =>
    setLineItems([...lineItems, { description: "", quantity: "1", unit_price: "" }]);

  const removeLineItem = (i: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== i));
  };

  const updateLineItem = (i: number, field: keyof LineInput, value: string) => {
    const updated = [...lineItems];
    updated[i] = { ...updated[i], [field]: value };
    setLineItems(updated);
  };

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("invoices")
      .select("*, invoice_line_items(*)")
      .eq("organisation_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setInvoices(data as unknown as InvoiceRow[]);
  }, [orgId]);

  const [createState, createAction, isCreating] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      formData.set(
        "line_items",
        JSON.stringify(
          lineItems
            .filter((l) => l.description && l.unit_price)
            .map((l) => ({
              description: l.description,
              quantity: l.quantity || "1",
              unit_price: l.unit_price,
            }))
        )
      );
      const result = await createInvoice(prev, formData);
      if (result.success) {
        setDialogOpen(false);
        setLineItems([{ description: "", quantity: "1", unit_price: "" }]);
        refresh();
      }
      return result;
    },
    {}
  );

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", status);
    await updateInvoiceStatus({}, formData);
    refresh();
  };

  const [payState, payAction, isPaying] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await recordPayment(prev, formData);
      if (result.success) {
        setPayDialogInvoice(null);
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
          <h1 className="text-lg font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage client invoices
          </p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Plus className="size-4" />
              New Invoice
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
              </DialogHeader>
              <form action={createAction} className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label>Contact (optional)</Label>
                  <Select name="contact_id">
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                          {c.email ? ` (${c.email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Issue Date</Label>
                    <Input type="date" name="issue_date" required className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label>Due Date</Label>
                    <Input type="date" name="due_date" required className="rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      name="tax_rate"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue="0"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Payment Terms</Label>
                    <Input
                      name="payment_terms"
                      placeholder="e.g. Net 30"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(i, "description", e.target.value)}
                        className="rounded-xl flex-1"
                      />
                      <Input
                        placeholder="Qty"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(i, "quantity", e.target.value)}
                        className="rounded-xl w-16"
                      />
                      <Input
                        placeholder="Price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(i, "unit_price", e.target.value)}
                        className="rounded-xl w-24"
                      />
                      <button
                        type="button"
                        onClick={() => removeLineItem(i)}
                        className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0 mt-0.5"
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                  <div className="text-right text-sm text-muted-foreground">
                    Subtotal:{" "}
                    <span className="font-mono text-foreground">
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Notes (optional)</Label>
                  <Input name="notes" className="rounded-xl" />
                </div>

                {createState.error && (
                  <p className="text-sm text-destructive">{createState.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isCreating || subtotal <= 0}
                  className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Invoice"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No invoices yet. Create your first invoice.
            </p>
          </div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-card border border-border rounded-xl p-4 transition-colors hover:border-[rgba(255,255,255,0.12)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium font-mono text-foreground">
                      {inv.invoice_number}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_STYLES[inv.status]
                      }`}
                    >
                      {INVOICE_STATUS_LABELS[inv.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Issued {new Date(inv.issue_date).toLocaleDateString()} · Due{" "}
                    {new Date(inv.due_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono font-medium text-foreground">
                    {inv.currency} {Number(inv.total).toFixed(2)}
                  </div>
                  {Number(inv.amount_paid) > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Paid: {Number(inv.amount_paid).toFixed(2)} · Due:{" "}
                      {Number(inv.amount_due).toFixed(2)}
                    </div>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    {inv.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(inv.id, "sent")}
                        className="size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                        aria-label="Mark as sent"
                        title="Mark as sent"
                      >
                        <Send className="size-3.5 text-[#7AA6B3]" />
                      </button>
                    )}
                    {(inv.status === "sent" ||
                      inv.status === "overdue" ||
                      inv.status === "partially_paid") && (
                      <button
                        onClick={() => setPayDialogInvoice(inv)}
                        className="size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                        aria-label="Record payment"
                        title="Record payment"
                      >
                        <CreditCard className="size-3.5 text-emerald-400" />
                      </button>
                    )}
                    {inv.status !== "voided" && inv.status !== "paid" && (
                      <button
                        onClick={() => handleStatusChange(inv.id, "voided")}
                        className="size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                        aria-label="Void invoice"
                        title="Void invoice"
                      >
                        <Ban className="size-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog
        open={payDialogInvoice !== null}
        onOpenChange={(open) => !open && setPayDialogInvoice(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {payDialogInvoice && (
            <form action={payAction} className="space-y-4 mt-2">
              <input type="hidden" name="invoice_id" value={payDialogInvoice.id} />
              <div className="bg-muted/30 rounded-xl p-3 text-sm">
                <p className="text-foreground font-medium">
                  {payDialogInvoice.invoice_number}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Amount due:{" "}
                  <span className="font-mono text-foreground">
                    {payDialogInvoice.currency}{" "}
                    {Number(payDialogInvoice.amount_due).toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    max={Number(payDialogInvoice.amount_due)}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" name="payment_date" required className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Method</Label>
                <Select name="payment_method" defaultValue="bank_transfer">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Reference (optional)</Label>
                <Input name="reference" className="rounded-xl" />
              </div>
              {payState.error && (
                <p className="text-sm text-destructive">{payState.error}</p>
              )}
              <button
                type="submit"
                disabled={isPaying}
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isPaying ? "Recording..." : "Record Payment"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
