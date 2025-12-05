import { IssueTaggingForm } from '@/components/project/issue-tagging-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waypoints, ListTodo, CircleDot, CheckCircle } from 'lucide-react';
import db from '@/lib/db';
import { notFound } from 'next/navigation';
import { StatCard } from '@/components/dashboard/stat-card';
import { IssuesByStatusChart } from '@/components/project/issues-by-status-chart';

type ProjectDashboardPageProps = {
    params: {
        orgSlug: string;
        projectKey: string;
    }
}

export default async function ProjectDashboardPage({ params }: ProjectDashboardPageProps) {
  const project = await db.project.findFirst({
    where: {
      key: params.projectKey,
      organization: {
        slug: params.orgSlug,
      },
    },
    include: {
      issues: {
        include: {
          status: true,
        },
      },
      statuses: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const totalIssues = project.issues.length;
  const openIssues = project.issues.filter(i => i.status.category !== 'DONE').length;
  const completedIssues = totalIssues - openIssues;
  
  const issuesByStatusData = project.statuses.map(status => ({
    name: status.name,
    count: project.issues.filter(issue => issue.statusId === status.id).length,
  }));


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          {project.name} Dashboard
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Issues" value={totalIssues} icon={ListTodo} />
          <StatCard title="Open Issues" value={openIssues} icon={CircleDot} />
          <StatCard title="Completed Issues" value={completedIssues} icon={CheckCircle} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Waypoints className='h-6 w-6 text-primary' />
              <CardTitle className="font-headline">Intelligent Issue Tagging</CardTitle>
            </div>
            <CardDescription>
              Describe your issue below and let AI suggest relevant tags to help you categorize your work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IssueTaggingForm />
          </CardContent>
        </Card>
        <div className="col-span-3">
            <IssuesByStatusChart data={issuesByStatusData} />
        </div>
      </div>
    </div>
  );
}
