
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import WelcomePage from "@/app/(app)/welcome/page";

export default async function DashboardRedirectPage() {
    const user = await getSession();
    if (!user) {
        redirect('/login');
    }

    // Find the most recently joined organization
    const mostRecentOrgMembership = await db.organizationMember.findFirst({
        where: { userId: user.id },
        include: {
            organization: {
                include: {
                    projects: {
                        orderBy: {
                            createdAt: 'asc'
                        },
                        take: 1,
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc' // Order by newest membership first
        }
    });

    if (mostRecentOrgMembership?.organization?.projects?.[0]) {
        const org = mostRecentOrgMembership.organization;
        const project = org.projects[0];
        redirect(`/${org.slug}/${project.key}`);
    }

    // If no project in the newest org, try any org
    const anyOrgMembership = await db.organizationMember.findFirst({
        where: { userId: user.id, organization: { projects: { some: {} } } },
         include: {
            organization: {
                include: {
                    projects: {
                        orderBy: { createdAt: 'asc' },
                        take: 1,
                    }
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    if (anyOrgMembership?.organization?.projects?.[0]) {
        const org = anyOrgMembership.organization;
        const project = org.projects[0];
        redirect(`/${org.slug}/${project.key}`);
    }


    // If no project at all, show the welcome page that instructs to select/create one.
    return <WelcomePage />;
}
