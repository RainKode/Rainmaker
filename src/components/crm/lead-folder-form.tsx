"use client";

import { useState, useCallback } from "react";
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
import { DEPARTMENT_OWNERS, DEPARTMENT_OWNER_LABELS } from "@/types/crm";
import { createLeadFolder } from "@/lib/actions/lead-folders";
import { FolderOpen } from "lucide-react";

type Props = {
  onCreated: () => void;
};

export function LeadFolderForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fromDept, setFromDept] = useState("");
  const [toDept, setToDept] = useState("");
  const [contactIdsInput, setContactIdsInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !fromDept || !toDept) return;
    setSaving(true);

    const contactIds = contactIdsInput
      .split(/[,\n]/)
      .map((id) => id.trim())
      .filter(Boolean);

    const formData = new FormData();
    formData.append("name", name.trim());
    if (description.trim()) formData.append("description", description.trim());
    formData.append("from_department", fromDept);
    formData.append("to_department", toDept);
    formData.append("contact_ids", JSON.stringify(contactIds));

    await createLeadFolder({}, formData);
    setSaving(false);
    onCreated();
  }, [name, description, fromDept, toDept, contactIdsInput, onCreated]);

  return (
    <Card className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <FolderOpen className="size-5" />
          New Lead Folder
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q4 Hot Leads"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes about this folder"
            className="rounded-xl min-h-[60px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>From Department</Label>
            <Select value={fromDept} onValueChange={(v) => v && setFromDept(v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_OWNERS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DEPARTMENT_OWNER_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>To Department</Label>
            <Select value={toDept} onValueChange={(v) => v && setToDept(v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_OWNERS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DEPARTMENT_OWNER_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Contact IDs (comma or newline separated)</Label>
          <Textarea
            value={contactIdsInput}
            onChange={(e) => setContactIdsInput(e.target.value)}
            placeholder="Paste contact IDs here…"
            className="rounded-xl min-h-[80px] font-mono text-xs"
          />
        </div>
        <Button
          className="rounded-full w-fit"
          onClick={handleSubmit}
          disabled={saving || !name.trim() || !fromDept || !toDept}
        >
          {saving ? "Creating…" : "Create Folder"}
        </Button>
      </CardContent>
    </Card>
  );
}
