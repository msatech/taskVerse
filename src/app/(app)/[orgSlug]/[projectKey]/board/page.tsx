import { notFound } from "next/navigation";
import db from "@/lib/db";
import { BoardView } from "@/components/board/board-view";

type ProjectBoardPageProps = {
    params: {
        orgSlug: string;
        projectKey: string;
    }
}

export default async function ProjectBoardPage({ params }: ProjectBoardPageProps) {
    const project = await db.project.findFirst({
        where: {
            key: params.projectKey,
            organization: {
                slug: params.orgSlug
            }
        },
        include: {
            statuses: {
                orderBy: { order: 'asc' }
            },
            issues: {
                include: {
                    assignee: true,
                    reporter: true,
                },
                orderBy: {
                    createdAt: 'desc' // This ordering can be more sophisticated (e.g., rank)
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
                <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name} Board</h1>
            </header>
            <main className="flex-1 overflow-x-auto p-4 md:p-8 pt-0">
                <BoardView project={project} statuses={project.statuses} issues={project.issues} users={projectUsers} />
            </main>
        </div>
    );
}
