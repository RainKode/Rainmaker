"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace, deleteWorkspace } from "@/lib/actions/workspaces";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

type Workspace = {
  id: string;
  name: string;
  is_default: boolean;
};

export default function WorkspacesClient({
  orgId,
  workspaces,
}: {
  orgId: string;
  workspaces: Workspace[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setMessage(null);

    const result = await createWorkspace(orgId, newName.trim());
    if (result.error) {
      setMessage(result.error);
    } else {
      setNewName("");
      router.refresh();
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    const result = await deleteWorkspace(id);
    if (result.error) {
      setMessage(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-3 items-end">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="ws-name" className="text-sm font-medium">
            New workspace
          </label>
          <input
            id="ws-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Marketing, Engineering"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring placeholder:text-muted-foreground"
          />
        </div>
        <Button type="submit" disabled={creating}>
          <Plus className="size-4 mr-1" />
          {creating ? "Creating…" : "Create"}
        </Button>
      </form>

      {message && <p className="text-sm text-destructive">{message}</p>}

      {/* Workspace list */}
      <div className="space-y-2">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{ws.name}</p>
              {ws.is_default && (
                <span className="text-[0.7rem] font-medium uppercase tracking-wider text-primary">
                  Default
                </span>
              )}
            </div>
            {!ws.is_default && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(ws.id)}
                aria-label={`Delete ${ws.name}`}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
