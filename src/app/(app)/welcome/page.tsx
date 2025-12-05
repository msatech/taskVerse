'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import type { Organization } from "@prisma/client";

// This is a dummy organization object for the welcome page.
// In a real app, you would fetch the user's actual organization.
const dummyOrg: Organization = {
  id: "clxnewu80000008l8df5g3k8d", // Example ID
  name: "Your Organization",
  slug: "your-org",
  ownerId: "user-id",
  plan: "FREE",
  createdAt: new Date(),
  updatedAt: new Date(),
};


export default function WelcomePage() {
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  return (
    <>
      <CreateProjectDialog
        organization={dummyOrg}
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
