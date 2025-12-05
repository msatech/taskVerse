import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";
import { redirect } from 'next/navigation';
import db from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  const orgMemberships = await db.organizationMember.findMany({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          projects: true,
        },
      },
    },
  });

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col">
        <DashboardHeader user={user} />
        <div className="flex flex-1">
          <Sidebar collapsible="icon" side="left" variant="sidebar" className="bg-sidebar">
            <DashboardSidebar orgMemberships={orgMemberships} />
          </Sidebar>
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
