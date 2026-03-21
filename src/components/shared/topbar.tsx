"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import {
  Moon,
  Sun,
  LogOut,
  User,
  Search,
  Square,
  Timer,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut } from "@/lib/actions/auth";
import { NotificationPanel } from "@/components/shared/notification-panel";
import { useTimerStore } from "@/lib/stores/timer-store";
import { stopTimer } from "@/lib/actions/time-entries";

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
  "/tasks/board": "Board",
  "/tasks/list": "List",
  "/tasks/my-tasks": "My Tasks",
  "/tasks/projects": "Projects",
  "/settings": "Settings",
  "/crm": "CRM",
  "/erp": "ERP",
};

export function Topbar({ userId }: { userId?: string }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const timer = useTimerStore();

  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(() => timer.tick(), 1000);
    return () => clearInterval(interval);
  }, [timer.isRunning, timer]);

  const handleStopTimer = async () => {
    const result = timer.stop();
    if (result) {
      await stopTimer(result.taskId, result.startedAt, result.durationMinutes);
    }
  };

  const pageTitle =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[pathname.split("/").slice(0, 3).join("/")] ??
    "Dashboard";

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3 md:px-4">
      {/* Left — sidebar trigger + page title */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-sm font-semibold md:text-base text-foreground">
          {pageTitle}
        </h1>
      </div>

      {/* Right — actions */}
      <div className="ml-auto flex items-center gap-1">
        {/* Active timer pill */}
        {timer.isRunning && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 mr-1">
            <Timer className="size-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tabular-nums">
              {formatElapsed(timer.elapsed)}
            </span>
            <button
              onClick={handleStopTimer}
              aria-label="Stop timer"
              className="inline-flex size-5 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
            >
              <Square className="size-2.5 text-primary" />
            </button>
          </div>
        )}

        {/* Search trigger */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  document.dispatchEvent(
                    new KeyboardEvent("keydown", {
                      key: "k",
                      metaKey: true,
                      bubbles: true,
                    })
                  )
                }
                aria-label="Search (Ctrl+K)"
              />
            }
          >
            <Search className="size-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Search <kbd className="ml-1 text-xs text-muted-foreground">⌘K</kbd>
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Notifications */}
        {userId && <NotificationPanel userId={userId} />}

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              />
            }
          >
            <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="User menu"
              />
            }
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <User className="size-3.5" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
