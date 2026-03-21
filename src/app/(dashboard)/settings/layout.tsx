"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Organisation", href: "/settings/organisation", icon: Building2 },
  { label: "Members", href: "/settings/members", icon: Users },
  { label: "Workspaces", href: "/settings/workspaces", icon: Boxes },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organisation, members, and workspaces.
        </p>
      </div>

      <SettingsTabs />

      {children}
    </div>
  );
}

function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
