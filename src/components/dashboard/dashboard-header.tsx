
"use client";

import { Search } from "lucide-react";
import type { User, Notification } from "@prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfile } from "./user-profile";
import { ProjectSwitcher, type OrgMembershipWithProjects } from "./project-switcher";
import { useParams } from "next/navigation";
import type { Invitation } from "@prisma/client";
import { NotificationBell } from "./notification-bell";

type DashboardHeaderProps = {
  user: Pick<User, "name" | "email" | "avatarUrl" | 'id'>;
  orgMemberships: OrgMembershipWithProjects[];
  invitations: Invitation[];
  initialNotifications: (Notification & { user: { name: string | null, avatarUrl: string | null } })[]
};

export function DashboardHeader({ user, orgMemberships, invitations, initialNotifications }: DashboardHeaderProps) {
  const params = useParams();
  const { orgSlug, projectKey } = params;

  const currentOrg = orgMemberships.find(m => m.organization.slug === orgSlug)?.organization;
  const currentProject = currentOrg?.projects.find(p => p.key === projectKey);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <div className="hidden md:flex">
          <ProjectSwitcher
              orgMemberships={orgMemberships}
              currentOrg={currentOrg}
              currentProject={currentProject}
            />
        </div>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search issues..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-secondary"
            />
          </div>
        </form>
        <ThemeToggle />
        <NotificationBell initialNotifications={initialNotifications} invitations={invitations} />
        <UserProfile user={user} invitations={invitations} />
      </div>
    </header>
  );
}
