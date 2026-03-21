"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  Users,
  Receipt,
  Settings,
  Search,
  Plus,
  Contact,
  Building2,
  GitBranch,
  Inbox,
  FolderOpen,
} from "lucide-react";

const STATIC_ROUTES = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Board View", href: "/tasks/board", icon: ListChecks },
  { label: "List View", href: "/tasks/list", icon: ListChecks },
  { label: "My Tasks", href: "/tasks/my-tasks", icon: ListChecks },
  { label: "Projects", href: "/tasks/projects", icon: FolderKanban },
  { label: "CRM", href: "/crm", icon: Users },
  { label: "Contacts", href: "/crm/contacts", icon: Contact },
  { label: "Companies", href: "/crm/companies", icon: Building2 },
  { label: "Pipelines", href: "/crm/pipelines", icon: GitBranch },
  { label: "Inbox", href: "/crm/inbox", icon: Inbox },
  { label: "Lead Folders", href: "/crm/lead-folders", icon: FolderOpen },
  { label: "ERP", href: "/erp", icon: Receipt },
  { label: "Settings", href: "/settings", icon: Settings },
];

const CREATE_ACTIONS = [
  { label: "New Task", href: "/tasks/board?new=true", icon: Plus },
  { label: "New Project", href: "/tasks/projects?new=true", icon: Plus },
  { label: "New Contact", href: "/crm/contacts?new=true", icon: Plus },
  { label: "New Company", href: "/crm/companies?new=true", icon: Plus },
];

type SearchResult = {
  id: string;
  title: string;
  type: "task" | "project" | "contact" | "deal";
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Search tasks/projects
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
        }
      } catch {
        // Silently fail search
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search tasks, contacts, deals, or navigate..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Search results */}
        {results.length > 0 && (
          <CommandGroup heading="Search Results">
            {results.map((r) => (
              <CommandItem
                key={r.id}
                value={r.title}
                onSelect={() =>
                  navigate(
                    r.type === "task"
                      ? `/tasks/board?task=${r.id}`
                      : r.type === "project"
                        ? `/tasks/projects/${r.id}`
                        : r.type === "contact"
                          ? `/crm/contacts/${r.id}`
                          : `/crm/pipelines`
                  )
                }
              >
                <Search className="mr-2 size-4 text-muted-foreground" />
                <span>{r.title}</span>
                <span className="ml-auto text-xs text-muted-foreground capitalize">
                  {r.type}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {STATIC_ROUTES.map((route) => (
            <CommandItem
              key={route.href}
              value={route.label}
              onSelect={() => navigate(route.href)}
            >
              <route.icon className="mr-2 size-4 text-muted-foreground" />
              {route.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick actions */}
        <CommandGroup heading="Create">
          {CREATE_ACTIONS.map((action) => (
            <CommandItem
              key={action.href}
              value={action.label}
              onSelect={() => navigate(action.href)}
            >
              <action.icon className="mr-2 size-4 text-muted-foreground" />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
