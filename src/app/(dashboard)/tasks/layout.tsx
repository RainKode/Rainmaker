"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, User, FolderKanban } from "lucide-react";

const TASK_NAV = [
  { label: "Board", href: "/tasks/board", icon: LayoutGrid },
  { label: "List", href: "/tasks/list", icon: List },
  { label: "My Tasks", href: "/tasks/my-tasks", icon: User },
  { label: "Projects", href: "/tasks/projects", icon: FolderKanban },
];

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav tabs */}
      <nav className="flex items-center gap-1 border-b border-border px-4 md:px-6">
        {TASK_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px min-h-[44px]",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
