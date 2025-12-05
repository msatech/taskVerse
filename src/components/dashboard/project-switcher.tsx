'use client';

import type { Organization, OrganizationMember, Project } from "@prisma/client";
import { ChevronsUpDown, PlusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useRouter } from "next/navigation";

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

  const handleProjectSelect = (project: Project) => {
    if (currentOrg) {
      router.push(`/${currentOrg.slug}/${project.key}`);
    }
  };

  return (
    <>
      {currentOrg && (
        <Button variant="ghost" className="w-full justify-between">
          <div className="truncate">
            <div className="text-xs text-muted-foreground">Organization</div>
            <div className="font-semibold">{currentOrg.name}</div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <div className="truncate">
              <div className="text-xs text-muted-foreground">Project</div>
              <div className="font-semibold">
                {currentProject ? currentProject.name : "Select a project"}
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search project..." />
              <CommandEmpty>No project found.</CommandEmpty>
              {orgMemberships.map(membership => (
                 <CommandGroup key={membership.organizationId} heading={membership.organization.name}>
                   {membership.organization.projects.map(project => (
                     <CommandItem
                      key={project.id}
                      onSelect={() => handleProjectSelect(project)}
                      className="text-sm"
                     >
                       {project.name}
                     </CommandItem>
                   ))}
                 </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
                <CommandGroup>
                    <CommandItem onSelect={() => { /* Handle create project */ }}>
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
