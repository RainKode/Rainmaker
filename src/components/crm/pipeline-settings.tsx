"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import {
  createPipelineStage,
  updatePipelineStage,
  reorderStages,
} from "@/lib/actions/crm";
import { DEPARTMENT_OWNERS, DEPARTMENT_OWNER_LABELS } from "@/types/crm";
import type { Pipeline, PipelineStage } from "@/types/crm";

type PipelineWithStages = Pipeline & { stages: PipelineStage[] };

type Props = {
  pipelines: PipelineWithStages[];
};

export function PipelineSettingsClient({ pipelines }: Props) {
  const router = useRouter();
  const [activePipeline, setActivePipeline] = useState<string>(
    pipelines[0]?.id ?? ""
  );

  const pipeline = pipelines.find((p) => p.id === activePipeline);
  const stages = pipeline?.stages
    ? [...pipeline.stages]
        .filter((s) => s.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <Link
          href="/crm/pipelines"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          Back to pipelines
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">
          Pipeline Settings
        </h1>
      </div>

      {/* Pipeline selector */}
      {pipelines.length > 1 && (
        <Select value={activePipeline} onValueChange={(v) => v && setActivePipeline(v)}>
          <SelectTrigger className="w-[240px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Stages */}
      {pipeline && (
        <Card className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
              Stages
            </CardTitle>
            <AddStageDialog
              pipelineId={pipeline.id}
              nextOrder={stages.length}
              onCreated={() => router.refresh()}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {stages.map((stage) => (
              <StageRow
                key={stage.id}
                stage={stage}
                onUpdated={() => router.refresh()}
              />
            ))}
            {stages.length === 0 && (
              <p className="text-sm text-[var(--text-hint)] py-4 text-center">
                No stages yet — add one to get started.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Stage Row ──────────────────────────────────────────────────────
function StageRow({
  stage,
  onUpdated,
}: {
  stage: PipelineStage;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const [colour, setColour] = useState(stage.colour);
  const [probability, setProbability] = useState(String(stage.probability));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updatePipelineStage({
      id: stage.id,
      name,
      colour,
      probability: Number(probability),
    });
    setEditing(false);
    setSaving(false);
    onUpdated();
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2.5 min-h-[48px]">
      <GripVertical className="size-4 text-[var(--text-hint)] shrink-0 cursor-grab" />
      <div
        className="size-4 rounded-full shrink-0"
        style={{ backgroundColor: colour }}
      />

      {editing ? (
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl h-8 w-32"
          />
          <Input
            value={colour}
            onChange={(e) => setColour(e.target.value)}
            type="color"
            className="rounded-xl h-8 w-12 p-0.5"
          />
          <Input
            value={probability}
            onChange={(e) => setProbability(e.target.value)}
            type="number"
            min={0}
            max={100}
            className="rounded-xl h-8 w-20"
            placeholder="%"
          />
          <Button
            size="sm"
            className="rounded-full"
            onClick={handleSave}
            disabled={saving}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
            {stage.name}
          </span>
          <span className="text-xs text-[var(--text-hint)] tabular-nums">
            {stage.probability}%
          </span>
          {stage.department_owner && (
            <span className="text-xs text-[var(--text-muted)]">
              {DEPARTMENT_OWNER_LABELS[stage.department_owner]}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            className="rounded-full"
            onClick={() => setEditing(true)}
          >
            <Settings className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Add Stage Dialog ───────────────────────────────────────────────
function AddStageDialog({
  pipelineId,
  nextOrder,
  onCreated,
}: {
  pipelineId: string;
  nextOrder: number;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [colour, setColour] = useState("#7AA6B3");
  const [probability, setProbability] = useState("50");
  const [department, setDepartment] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("pipeline_id", pipelineId);
    formData.append("name", name.trim());
    formData.append("colour", colour);
    formData.append("probability", probability);
    formData.append("sort_order", String(nextOrder));
    if (department) formData.append("department_owner", department);

    await createPipelineStage({}, formData);

    setName("");
    setColour("#7AA6B3");
    setProbability("50");
    setDepartment("");
    setSaving(false);
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="rounded-full" />}>
          <Plus className="size-3.5 mr-1" />
          Add Stage
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[var(--bg-card)] border-[var(--border-default)]">
        <DialogHeader>
          <DialogTitle>Add Pipeline Stage</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              placeholder="e.g. Qualification"
            />
          </div>
          <div className="flex gap-3">
            <div className="space-y-1.5 flex-1">
              <Label>Colour</Label>
              <Input
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                type="color"
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>Probability (%)</Label>
              <Input
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                type="number"
                min={0}
                max={100}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Department Owner</Label>
            <Select value={department} onValueChange={(v) => setDepartment(v ?? "")}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Optional" />
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
          <Button
            className="rounded-full"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
          >
            {saving ? "Creating…" : "Create Stage"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
