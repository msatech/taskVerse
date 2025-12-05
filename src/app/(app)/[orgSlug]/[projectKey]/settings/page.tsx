
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { SettingsTabs } from "./settings-tabs";
import { getSession } from "@/lib/session";

type ProjectSettingsPageProps = {
    params: {
        orgSlug: string;
        projectKey: string;
    }
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
    const user = await getSession();
     if (!user) {
        return notFound();
    }

    const org = await db.organization.findUnique({
        where: {
            slug: params.orgSlug,
        },
        include: {
            members: {
                include: {
                    user: true
                }
            }
        }
    });

    const project = await db.project.findFirst({
        where: {
            key: params.projectKey,
            organizationId: org?.id
        },
        include: {
            lead: true
        }
    });

    if (!project || !org) {
        notFound();
    }

    const currentUserMember = org.members.find(m => m.userId === user.id);
    if (!currentUserMember) {
        return notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <header className="space-y-2">
                 <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name} Settings</h1>
                 <p className="text-muted-foreground">Manage your project settings and team members.</p>
            </header>
            <SettingsTabs 
                project={project}
                organization={org}
                members={org.members}
                currentUserRole={currentUserMember.role}
            />
        </div>
    );
}
