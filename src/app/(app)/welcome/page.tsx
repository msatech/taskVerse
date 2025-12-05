import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function WelcomePage() {
  return (
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
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
