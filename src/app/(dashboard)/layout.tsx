import { AppSidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { CommandPalette } from "@/components/shared/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <Topbar userId={user?.id} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </SidebarInset>
      <BottomNav />
      <CommandPalette />
    </SidebarProvider>
  );
}
