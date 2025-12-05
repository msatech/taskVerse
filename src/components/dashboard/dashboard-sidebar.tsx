"use client";

import {
  GanttChart,
  Home,
  ListTodo,
  Presentation,
  Settings,
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
import { ProjectSwitcher, type OrgMembershipWithProjects } from "./project-switcher";

type DashboardSidebarProps = {
  orgMemberships: OrgMembershipWithProjects[];
};

export function DashboardSidebar({ orgMemberships }: DashboardSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const { orgSlug, projectKey } = params;

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
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <ProjectSwitcher
            orgMemberships={orgMemberships}
            currentOrg={currentOrg}
            currentProject={currentProject}
          />
        </SidebarGroup>

        {currentProject && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
          </>
        )}
      </SidebarContent>
    </>
  );
}
