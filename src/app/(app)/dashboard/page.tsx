import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import AppRootPage from "../page";

export default async function DashboardRedirectPage() {
    const user = await getSession();
    if (!user) {
        redirect('/login');
    }

    const firstOrgMembership = await db.organizationMember.findFirst({
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
            createdAt: 'asc'
        }
    });

    if (firstOrgMembership?.organization?.projects?.[0]) {
        const org = firstOrgMembership.organization;
        const project = org.projects[0];
        redirect(`/${org.slug}/${project.key}`);
    }

    // If no project, show the welcome page that instructs to select/create one.
    return <AppRootPage />;
}
