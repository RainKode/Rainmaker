"use client";

import { useCallback, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, DollarSign, Trash2, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateDeal, deleteDeal } from "@/lib/actions/crm";
import { format } from "date-fns";
import type { Deal, PipelineStage } from "@/types/crm";

type DealDrawerProps = {
  deal: Deal | null;
  stages: PipelineStage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function DealDrawer({
  deal,
  stages,
  open,
  onOpenChange,
  onUpdated,
}: DealDrawerProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldUpdate = useCallback(
    async (field: string, value: unknown) => {
      if (!deal) return;
      setIsSaving(true);
      try {
        await updateDeal({ id: deal.id, [field]: value });
        onUpdated?.();
      } finally {
        setIsSaving(false);
      }
    },
    [deal, onUpdated]
  );

  const handleDelete = useCallback(async () => {
    if (!deal) return;
    setIsDeleting(true);
    try {
      await deleteDeal(deal.id);
      onOpenChange(false);
      onUpdated?.();
    } finally {
      setIsDeleting(false);
    }
  }, [deal, onOpenChange, onUpdated]);

  if (!deal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-[var(--bg-card)] border-l border-[var(--border-default)]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-bold text-[var(--text-primary)]">
            {deal.name}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 pb-8">
          {/* Deal Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--text-muted)]">
              Deal Name
            </Label>
            <Input
              defaultValue={deal.name}
              onBlur={(e) => {
                if (e.target.value !== deal.name) {
                  handleFieldUpdate("name", e.target.value);
                }
              }}
              className="rounded-xl"
            />
          </div>

          {/* Value */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--text-muted)]">
              Value
            </Label>
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-[var(--text-hint)]" />
              <Input
                type="number"
                defaultValue={deal.value ?? ""}
                onBlur={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  if (val !== deal.value) {
                    handleFieldUpdate("value", val);
                  }
                }}
                className="rounded-xl"
                placeholder="0"
              />
            </div>
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--text-muted)]">
              Stage
            </Label>
            <Select
              defaultValue={deal.stage_id ?? undefined}
              onValueChange={(val) => handleFieldUpdate("stage_id", val)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stage.colour }}
                      />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expected Close Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--text-muted)]">
              Expected Close Date
            </Label>
            <Input
              type="date"
              defaultValue={
                deal.expected_close_date
                  ? format(new Date(deal.expected_close_date), "yyyy-MM-dd")
                  : ""
              }
              onBlur={(e) => {
                const val = e.target.value || null;
                if (val !== deal.expected_close_date) {
                  handleFieldUpdate("expected_close_date", val);
                }
              }}
              className="rounded-xl"
            />
          </div>

          {/* Payment Terms */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--text-muted)]">
              Payment Terms
            </Label>
            <Textarea
              defaultValue={deal.payment_terms ?? ""}
              onBlur={(e) => {
                const val = e.target.value || null;
                if (val !== deal.payment_terms) {
                  handleFieldUpdate("payment_terms", val);
                }
              }}
              className="rounded-xl min-h-[80px]"
              placeholder="e.g. Net 30"
            />
          </div>

          {/* Loss Reason (only if lost) */}
          {deal.lost_at && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--text-muted)]">
                Loss Reason
              </Label>
              <Textarea
                defaultValue={deal.loss_reason ?? ""}
                onBlur={(e) => {
                  const val = e.target.value || null;
                  if (val !== deal.loss_reason) {
                    handleFieldUpdate("loss_reason", val);
                  }
                }}
                className="rounded-xl min-h-[60px]"
              />
            </div>
          )}

          <Separator className="bg-[var(--border-default)]" />

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-hint)]">
            <div>
              <span className="font-medium">Created</span>
              <p className="mt-0.5">
                {format(new Date(deal.created_at), "MMM dd, yyyy")}
              </p>
            </div>
            {deal.won_at && (
              <div>
                <span className="font-medium">Won</span>
                <p className="mt-0.5">
                  {format(new Date(deal.won_at), "MMM dd, yyyy")}
                </p>
              </div>
            )}
            {deal.lost_at && (
              <div>
                <span className="font-medium">Lost</span>
                <p className="mt-0.5">
                  {format(new Date(deal.lost_at), "MMM dd, yyyy")}
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-[var(--border-default)]" />

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full w-fit"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5 mr-1.5" />
            {isDeleting ? "Deleting…" : "Delete Deal"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
