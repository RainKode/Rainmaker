"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCompany, updateCompany } from "@/lib/actions/crm";
import { COMPANY_SIZES, COMPANY_SIZE_LABELS } from "@/types/crm";
import type { Company } from "@/types/crm";
import { Building2 } from "lucide-react";

type Props = {
  company?: Company | null;
  onSaved?: () => void;
};

export function CompanyForm({ company, onSaved }: Props) {
  const isEdit = !!company;
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: string }, formData: FormData) => {
      if (isEdit && company) {
        const result = await updateCompany({
          id: company.id,
          name: formData.get("name") as string,
          domain: (formData.get("domain") as string) || null,
          industry: (formData.get("industry") as string) || null,
          size: (formData.get("size") as string) || null,
          phone: (formData.get("phone") as string) || null,
          website: (formData.get("website") as string) || null,
          notes: (formData.get("notes") as string) || null,
        });
        if (result.success) onSaved?.();
        return result;
      }
      const result = await createCompany(_prev, formData);
      if (result.success) onSaved?.();
      return result;
    },
    {}
  );

  return (
    <Card className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Building2 className="size-5" />
          {isEdit ? "Edit Company" : "New Company"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={company?.name ?? ""}
              required
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                name="domain"
                defaultValue={company?.domain ?? ""}
                placeholder="example.com"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                defaultValue={company?.industry ?? ""}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="size">Size</Label>
              <Select
                name="size"
                defaultValue={company?.size ?? undefined}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {COMPANY_SIZE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={company?.phone ?? ""}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              defaultValue={company?.website ?? ""}
              placeholder="https://…"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={company?.notes ?? ""}
              className="rounded-xl min-h-[60px]"
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button
            type="submit"
            className="rounded-full w-fit"
            disabled={isPending}
          >
            {isPending
              ? "Saving…"
              : isEdit
                ? "Update Company"
                : "Create Company"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
