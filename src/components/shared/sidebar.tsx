"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Receipt,
  Settings,
  LayoutGrid,
  List,
  User,
  FolderKanban,
  ChevronRight,
  Building2,
  Inbox,
  FolderOpen,
  GitBranch,
  Contact,
  BookOpen,
  Calendar,
  FileText,
  CreditCard,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavChild = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Tasks",
        href: "/tasks",
        icon: ListChecks,
        children: [
          { label: "Board", href: "/tasks/board", icon: LayoutGrid },
          { label: "List", href: "/tasks/list", icon: List },
          { label: "My Tasks", href: "/tasks/my-tasks", icon: User },
          { label: "Projects", href: "/tasks/projects", icon: FolderKanban },
        ],
      },
      { label: "CRM", href: "/crm", icon: Users, children: [
          { label: "Contacts", href: "/crm/contacts", icon: Contact },
          { label: "Companies", href: "/crm/companies", icon: Building2 },
          { label: "Pipelines", href: "/crm/pipelines", icon: GitBranch },
          { label: "Inbox", href: "/crm/inbox", icon: Inbox },
          { label: "Lead Folders", href: "/crm/lead-folders", icon: FolderOpen },
        ] },
      { label: "ERP", href: "/erp", icon: Receipt, children: [
          { label: "Accounts", href: "/erp/accounts", icon: BookOpen },
          { label: "Periods", href: "/erp/periods", icon: Calendar },
          { label: "Journal Entries", href: "/erp/journals", icon: FileText },
          { label: "Invoices", href: "/erp/invoices", icon: CreditCard },
          { label: "Expenses", href: "/erp/expenses", icon: Receipt },
          { label: "Reports", href: "/erp/reports", icon: BarChart3 },
        ] },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

function checkActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/"))
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Brand header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                R
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                Rainmaker
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = checkActive(pathname, item.href);

                  if (item.children) {
                    return (
                      <Collapsible
                        key={item.href}
                        defaultOpen={active}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            render={<CollapsibleTrigger />}
                            isActive={active}
                            tooltip={item.label}
                          >
                              <item.icon className="size-4" />
                              <span>{item.label}</span>
                            <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    render={<Link href={child.href} />}
                                    isActive={pathname === child.href}
                                  >
                                    <child.icon className="size-3.5" />
                                    <span>{child.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        tooltip={item.label}
                      >
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Rail for collapsed hover-expand */}
      <SidebarRail />
    </Sidebar>
  );
}
