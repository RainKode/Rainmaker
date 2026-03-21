"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DEPARTMENT_OWNER_LABELS,
  LEAD_FOLDER_STATUS_LABELS,
} from "@/types/crm";
import type {
  LeadFolder,
  DepartmentOwner,
  LeadFolderStatus,
} from "@/types/crm";
import {
  acceptLeadFolder,
  updateLeadFolderStatus,
} from "@/lib/actions/lead-folders";
import { format } from "date-fns";
import {
  FolderOpen,
  ArrowRight,
  Check,
  Clock,
  Loader2,
} from "lucide-react";
import { LeadFolderForm } from "@/components/crm/lead-folder-form";

const STATUS_COLOURS: Record<LeadFolderStatus, string> = {
  pending: "bg-[#7AA6B3]/15 text-[#7AA6B3]",
  in_progress: "bg-[#EE6C29]/15 text-[#EE6C29]",
  completed: "bg-[#3D4141]/15 text-[#3D4141]",
};

const STATUS_ICONS: Record<LeadFolderStatus, typeof Clock> = {
  pending: Clock,
  in_progress: Loader2,
  completed: Check,
};

type Props = {
  folders: LeadFolder[];
};

export function LeadFoldersClient({ folders }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Folders</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Hand off contacts between departments
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => setShowForm(!showForm)}
        >
          <FolderOpen className="size-4 mr-1.5" />
          {showForm ? "Cancel" : "New Folder"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <LeadFolderForm
          onCreated={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}

      {/* Folder list */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            onUpdated={() => router.refresh()}
          />
        ))}
      </div>

      {folders.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="size-12 text-[var(--text-hint)] mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            No lead folders yet
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Create a folder to hand off contacts between departments.
          </p>
        </div>
      )}
    </div>
  );
}

function FolderCard({
  folder,
  onUpdated,
}: {
  folder: LeadFolder;
  onUpdated: () => void;
}) {
  const [accepting, setAccepting] = useState(false);

  const StatusIcon = STATUS_ICONS[folder.status];

  const handleAccept = async () => {
    setAccepting(true);
    await acceptLeadFolder(folder.id);
    setAccepting(false);
    onUpdated();
  };

  return (
    <Card className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
            {folder.name}
          </CardTitle>
          <Badge
            variant="secondary"
            className={`rounded-full text-[0.6rem] ${STATUS_COLOURS[folder.status]}`}
          >
            <StatusIcon className="size-3 mr-1" />
            {LEAD_FOLDER_STATUS_LABELS[folder.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {folder.description && (
          <p className="text-xs text-[var(--text-muted)] line-clamp-2">
            {folder.description}
          </p>
        )}

        {/* Department flow */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-[var(--text-primary)]">
            {DEPARTMENT_OWNER_LABELS[folder.from_department]}
          </span>
          <ArrowRight className="size-3.5 text-[var(--text-hint)]" />
          <span className="font-medium text-[var(--text-primary)]">
            {DEPARTMENT_OWNER_LABELS[folder.to_department]}
          </span>
        </div>

        {/* Count + date */}
        <div className="flex items-center justify-between text-[0.65rem] text-[var(--text-hint)]">
          <span>{folder.contact_ids?.length ?? 0} contacts</span>
          <span>{format(new Date(folder.submitted_at), "MMM dd, yyyy")}</span>
        </div>

        {/* Accept button */}
        {folder.status === "pending" && (
          <Button
            size="sm"
            className="rounded-full w-full"
            onClick={handleAccept}
            disabled={accepting}
          >
            <Check className="size-3.5 mr-1" />
            {accepting ? "Accepting…" : "Accept & Transfer"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
