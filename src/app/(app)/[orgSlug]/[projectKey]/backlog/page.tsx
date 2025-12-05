
import { notFound } from "next/navigation";
import db from "@/lib/db";
import { BacklogView } from "@/components/project/backlog-view";

type ProjectBacklogPageProps = {
    params: {
        orgSlug: string;
        projectKey: string;
    }
}

export default async function ProjectBacklogPage({ params }: ProjectBacklogPageProps) {
    const project = await db.project.findFirst({
        where: {
            key: params.projectKey,
            organization: {
                slug: params.orgSlug
            }
        },
        include: {
            issues: {
                where: { sprints: { none: {} } }, // Issues not in any sprint
                include: {
                    assignee: true,
                    status: true,
                    reporter: true,
                },
                orderBy: {
                    createdAt: 'asc' // Replace with rank later
                }
            },
            statuses: {
                orderBy: {
                    order: 'asc'
                }
            },
             organization: {
                include: {
                    members: {
                        include: {
                            user: true,
                        }
                    }
                }
            }
        }
    });

    if (!project) {
        notFound();
    }
    
    const projectUsers = project.organization.members.map(member => member.user);

    return (
        <div className="flex flex-col h-full">
             <header className="p-4 pt-6 md:p-8">
                <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name} Backlog</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-0">
               <BacklogView project={project} issues={project.issues} statuses={project.statuses} users={projectUsers} />
            </main>
        </div>
    );
}
