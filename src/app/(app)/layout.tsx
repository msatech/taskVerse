
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";
import { redirect } from 'next/navigation';
import db from "@/lib/db";
import { Notification } from "@prisma/client";

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

  const invitations = await db.invitation.findMany({
    where: {
      email: user.email,
      expires: {
        gt: new Date()
      }
    }
  });

  const notifications = await db.notification.findMany({
      where: {
          userId: user.id,
      },
      orderBy: {
          createdAt: 'desc',
      },
      take: 20,
      include: {
          user: true // The user who created the notification
      }
  });

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col bg-background">
        <DashboardHeader user={user} orgMemberships={orgMemberships} invitations={invitations} initialNotifications={notifications as (Notification & { user: {name: string | null, avatarUrl: string | null}} )[]} />
        <div className="flex flex-1">
          <Sidebar collapsible="icon" side="left" variant="sidebar" className="bg-sidebar border-r">
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
