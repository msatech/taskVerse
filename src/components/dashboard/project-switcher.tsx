
'use client';

import type { Organization, OrganizationMember, Project } from "@prisma/client";
import { ChevronsUpDown, PlusCircle, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateProjectDialog } from "../project/create-project-dialog";
import { cn } from "@/lib/utils";
import { Logo } from "../logo";


export type OrgMembershipWithProjects = OrganizationMember & {
  organization: Organization & {
    projects: Project[];
  };
};

type ProjectSwitcherProps = {
  orgMemberships: OrgMembershipWithProjects[];
  currentOrg?: Organization;
  currentProject?: Project;
};

export function ProjectSwitcher({ orgMemberships, currentOrg, currentProject }: ProjectSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);


  const handleProjectSelect = (orgSlug: string, projectKey: string) => {
      setOpen(false);
      router.push(`/${orgSlug}/${projectKey}`);
  };

  const handleCreateProject = (org: Organization) => {
    setOpen(false);
    setShowCreateProjectDialog(true);
  }

  return (
    <>
      {currentOrg && (
        <CreateProjectDialog
          organization={currentOrg}
          open={showCreateProjectDialog}
          onOpenChange={setShowCreateProjectDialog}
        />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="w-full max-w-[240px] justify-between">
            <div className="flex items-center gap-2">
                <Logo />
                {currentProject && (
                    <>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-semibold">{currentProject.name}</span>
                    </>
                )}
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search project..." />
              <CommandEmpty>No project found.</CommandEmpty>
              {orgMemberships.map(membership => (
                 <CommandGroup key={membership.organizationId} heading={membership.organization.name}>
                   {membership.organization.projects.map(project => (
                     <CommandItem
                      key={project.id}
                      onSelect={() => handleProjectSelect(membership.organization.slug, project.key)}
                      className="text-sm cursor-pointer"
                     >
                        <Check className={cn("mr-2 h-4 w-4", currentProject?.id === project.id ? "opacity-100" : "opacity-0")} />
                       {project.name}
                     </CommandItem>
                   ))}
                 </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
                <CommandGroup>
                    <CommandItem onSelect={() => currentOrg && handleCreateProject(currentOrg)} className="cursor-pointer">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Create Project
                    </CommandItem>
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
