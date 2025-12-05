
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import type { Organization, OrganizationMember } from "@prisma/client";
import { getSession } from "@/lib/session"; // We can't use server-side getSession here

type OrgMembershipWithOrg = OrganizationMember & { organization: Organization };

async function fetchUserOrganization() {
  // This is a client-side fetch, so we use an API route
  const res = await fetch('/api/user/organization');
  if (!res.ok) {
    throw new Error('Failed to fetch organization');
  }
  return res.json();
}


export default function WelcomePage() {
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      try {
        const orgData = await fetchUserOrganization();
        if (orgData) {
            setOrganization(orgData);
        }
      } catch (error) {
        console.error("Failed to load user organization", error);
        // Handle error, maybe show a toast
      } finally {
        setIsLoading(false);
      }
    }
    loadOrg();
  }, []);


  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
     return (
       <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Error</CardTitle>
            <CardDescription>
              We couldn&apos;t find an organization for your account. Please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
     )
  }


  return (
    <>
      <CreateProjectDialog
        organization={organization}
        open={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
      />
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Welcome to TaskVerse!</CardTitle>
            <CardDescription>
              You&apos;re all set up. Your next step is to create your first project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Projects help you organize your work, track issues, and collaborate with your team.
            </p>
            <Button size="lg" onClick={() => setShowCreateProjectDialog(true)}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
