import { notFound } from "next/navigation";
import db from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon } from "lucide-react";
import { IssuesByStatusChart } from "@/components/project/issues-by-status-chart";

type ProjectReportsPageProps = {
    params: {
        orgSlug: string;
        projectKey: string;
    }
}

export default async function ProjectReportsPage({ params }: ProjectReportsPageProps) {
    const project = await db.project.findFirst({
        where: {
            key: params.projectKey,
            organization: {
                slug: params.orgSlug
            }
        },
        include: {
            issues: {
                include: {
                    status: true,
                }
            },
            statuses: {
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!project) {
        notFound();
    }

    const issuesByStatusData = project.statuses.map(status => ({
        name: status.name,
        count: project.issues.filter(issue => issue.statusId === status.id).length,
    }));

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight">{project.name} Reports</h1>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Burndown Chart</CardTitle>
                        <CardDescription>Active sprint progress</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <BarChartIcon className="mx-auto h-12 w-12" />
                            <p>Burndown chart will be shown here.</p>
                        </div>
                    </CardContent>
                </Card>
                <div className="h-full">
                    <IssuesByStatusChart data={issuesByStatusData} />
                </div>
            </div>
        </div>
    );
}
