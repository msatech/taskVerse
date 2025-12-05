import { notFound } from "next/navigation";
import db from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectSettingsPageProps = {
    params: {
        orgSlug: string;
        projectKey: string;
    }
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
    const project = await db.project.findFirst({
        where: {
            key: params.projectKey,
            organization: {
                slug: params.orgSlug
            }
        },
    });

    if (!project) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name} Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage your project details and configuration.</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-muted-foreground text-center p-8">Project settings will be available here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
