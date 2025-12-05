import { notFound } from "next/navigation";
import db from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
                },
                orderBy: {
                    createdAt: 'asc' // Replace with rank later
                }
            }
        }
    });

    if (!project) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name} Backlog</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Backlog</CardTitle>
                    <CardDescription>{project.issues.length} issues</CardDescription>
                </CardHeader>
                <CardContent>
                    {project.issues.length > 0 ? (
                        <ul>
                            {project.issues.map(issue => (
                                <li key={issue.id} className="border-b p-3 flex justify-between items-center">
                                    <div>
                                        <p>{issue.key} - {issue.title}</p>
                                        <p className="text-sm text-muted-foreground">{issue.type} - {issue.priority}</p>
                                    </div>
                                    <span className="text-sm font-medium">{issue.status.name}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center p-8">Your backlog is empty.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
