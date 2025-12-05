
"use client";

import {
  GanttChart,
  Home,
  ListTodo,
  Presentation,
  Settings,
  Plus,
  Users,
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Logo } from "../logo";
import Link from "next/link";
import { useParams, usePathname } from 'next/navigation';
import { type OrgMembershipWithProjects } from "./project-switcher";
import { Button } from "../ui/button";
import { CreateProjectDialog } from "../project/create-project-dialog";
import { useState } from "react";

type DashboardSidebarProps = {
  orgMemberships: OrgMembershipWithProjects[];
};

export function DashboardSidebar({ orgMemberships }: DashboardSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { orgSlug, projectKey } = params;
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  const currentOrg = orgMemberships.find(m => m.organization.slug === orgSlug)?.organization;
  const currentProject = currentOrg?.projects.find(p => p.key === projectKey);

  const menuItems = currentProject ? [
    { href: `/${currentOrg.slug}/${currentProject.key}`, icon: <Home />, label: "Dashboard" },
    { href: `/${currentOrg.slug}/${currentProject.key}/backlog`, icon: <ListTodo />, label: "Backlog" },
    { href: `/${currentOrg.slug}/${currentProject.key}/board`, icon: <Presentation />, label: "Board" },
    { href: `/${currentOrg.slug}/${currentProject.key}/reports`, icon: <GanttChart />, label: "Reports" },
    { href: `/${currentOrg.slug}/${currentProject.key}/settings`, icon: <Settings />, label: "Settings" },
  ] : [];

  return (
    <>
      {currentOrg && <CreateProjectDialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog} organization={currentOrg} />}
      <SidebarHeader className="border-b">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarSeparator />

        {currentOrg && (
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                <span>Projects</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowCreateProjectDialog(true)}>
                    <Plus className="h-4 w-4" />
                </Button>
              </SidebarGroupLabel>
              <SidebarMenu>
                {currentOrg.projects.map(project => (
                   <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild isActive={project.key === projectKey} tooltip={project.name}>
                      <Link href={`/${currentOrg.slug}/${project.key}`}>
                        <span className="w-4 h-4 rounded-full bg-orange-400" />
                        <span>{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
        )}

      </SidebarContent>
    </>
  );
}
