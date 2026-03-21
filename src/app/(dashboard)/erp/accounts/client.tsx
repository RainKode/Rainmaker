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
import {
  ChevronRight,
  Plus,
  Power,
  PowerOff,
} from "lucide-react";
import { createAccount, toggleAccount, type ActionState } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";
import type { Account, AccountType, AccountTreeNode } from "@/types/erp";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
} from "@/types/erp";

type Props = {
  initialAccounts: Account[];
  orgId: string;
  userRole: string;
};

function buildTree(accounts: Account[]): AccountTreeNode[] {
  const map = new Map<string, AccountTreeNode>();
  const roots: AccountTreeNode[] = [];

  for (const acc of accounts) {
    map.set(acc.id, { ...acc, children: [] });
  }

  for (const acc of accounts) {
    const node = map.get(acc.id)!;
    if (acc.parent_id && map.has(acc.parent_id)) {
      map.get(acc.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

const TYPE_COLOURS: Record<AccountType, string> = {
  asset: "bg-[#7AA6B3]/15 text-[#9EC6D1]",
  liability: "bg-[#EE6C29]/15 text-[#FAC09A]",
  equity: "bg-[#D45A1E]/15 text-[#FAC09A]",
  revenue: "bg-emerald-500/15 text-emerald-400",
  expense: "bg-[#3D4141] text-[#D4DADA]",
};

function AccountRow({
  node,
  depth,
  canManage,
  onToggle,
}: {
  node: AccountTreeNode;
  depth: number;
  canManage: boolean;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <div
        className={`flex items-center gap-3 py-2.5 px-4 border-b border-border transition-colors hover:bg-muted/50 ${
          !node.is_active ? "opacity-50" : ""
        }`}
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className="size-5 flex items-center justify-center shrink-0"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {hasChildren && (
            <ChevronRight
              className={`size-3.5 text-muted-foreground transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          )}
        </button>

        {/* Code */}
        <span className="text-sm font-mono text-muted-foreground w-16 shrink-0">
          {node.code}
        </span>

        {/* Name */}
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {node.name}
        </span>

        {/* Type badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            TYPE_COLOURS[node.account_type]
          }`}
        >
          {ACCOUNT_TYPE_LABELS[node.account_type]}
        </span>

        {/* Balance direction */}
        <span className="text-xs text-muted-foreground w-12 text-right capitalize">
          {node.normal_balance}
        </span>

        {/* Actions */}
        {canManage && !node.is_system && (
          <button
            onClick={() => onToggle(node.id, !node.is_active)}
            className="size-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={node.is_active ? "Deactivate" : "Activate"}
          >
            {node.is_active ? (
              <PowerOff className="size-3.5 text-muted-foreground" />
            ) : (
              <Power className="size-3.5 text-[#EE6C29]" />
            )}
          </button>
        )}
        {node.is_system && (
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            System
          </span>
        )}
      </div>

      {expanded &&
        node.children.map((child) => (
          <AccountRow
            key={child.id}
            node={child}
            depth={depth + 1}
            canManage={canManage}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export function AccountsClient({ initialAccounts, orgId, userRole }: Props) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const canManage = ["owner", "admin", "manager"].includes(userRole);

  const tree = buildTree(accounts);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .eq("organisation_id", orgId)
      .order("code", { ascending: true });
    if (data) setAccounts(data as Account[]);
  }, [orgId]);

  const handleToggle = async (id: string, active: boolean) => {
    await toggleAccount(id, active);
    refresh();
  };

  const [state, formAction, isPending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createAccount(prev, formData);
      if (result.success) {
        setDialogOpen(false);
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
          <h1 className="text-lg font-bold text-foreground">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organisation&apos;s account structure
          </p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Plus className="size-4" />
              Add Account
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Account</DialogTitle>
              </DialogHeader>
              <form action={formAction} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Code</Label>
                    <Input
                      name="code"
                      required
                      placeholder="e.g. 1400"
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select name="account_type" required>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {ACCOUNT_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input name="name" required className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label>Parent Account (optional)</Label>
                  <Select name="parent_id">
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.is_active)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Description (optional)</Label>
                  <Input name="description" className="rounded-xl" />
                </div>
                {state.error && (
                  <p className="text-sm text-destructive">{state.error}</p>
                )}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Account"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Accounts Tree */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 py-2 px-4 border-b border-border bg-muted/30">
          <span className="size-5 shrink-0" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-16 shrink-0">
            Code
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex-1">
            Name
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Type
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-12 text-right">
            Dr/Cr
          </span>
          <span className="size-7 shrink-0" />
        </div>

        {tree.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No accounts found. Create your first account to get started.
          </div>
        ) : (
          tree.map((node) => (
            <AccountRow
              key={node.id}
              node={node}
              depth={0}
              canManage={canManage}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
