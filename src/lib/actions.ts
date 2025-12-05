
'use server'

import { revalidatePath } from "next/cache";
import db from "./db";
import { getSession } from "./session";

export async function updateIssueStatus(issueId: string, statusId: string, orgSlug: string, projectKey: string) {
    const user = await getSession();
    if (!user) {
        throw new Error("Not authenticated");
    }

    try {
        const issue = await db.issue.findUnique({
            where: { id: issueId },
            include: { project: { include: { organization: true } } }
        });

        if (!issue) {
            throw new Error("Issue not found");
        }

        const orgMember = await db.organizationMember.findFirst({
            where: {
                userId: user.id,
                organizationId: issue.project.organizationId,
            }
        });

        if (!orgMember) {
            throw new Error("Not authorized");
        }

        await db.issue.update({
            where: { id: issueId },
            data: { statusId },
        });

        revalidatePath(`/${orgSlug}/${projectKey}/board`);
        revalidatePath(`/${orgSlug}/${projectKey}`);
        
        return { success: true };
    } catch (error) {
        console.error("Failed to update issue status:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}


export async function createComment(issueId: string, body: string, orgSlug: string, projectKey: string) {
    const user = await getSession();
    if (!user) {
        throw new Error("Not authenticated");
    }

    if (!body.trim()) {
        throw new Error("Comment body cannot be empty");
    }

    try {
        const issue = await db.issue.findUnique({
            where: { id: issueId },
            include: { project: { include: { organization: true } } }
        });

        if (!issue) {
            throw new Error("Issue not found");
        }

        const orgMember = await db.organizationMember.findFirst({
            where: {
                userId: user.id,
                organizationId: issue.project.organizationId,
            }
        });

        if (!orgMember) {
            throw new Error("Not authorized");
        }

        const comment = await db.comment.create({
            data: {
                body,
                issueId,
                authorId: user.id,
            },
            include: {
                author: true,
            }
        });
        
        revalidatePath(`/api/issues/${issueId}`); // This won't work as expected, but client can refetch
        
        return { success: true, comment };
    } catch (error) {
        console.error("Failed to create comment:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
