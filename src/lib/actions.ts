
'use server'

import { revalidatePath } from "next/cache";
import db from "./db";
import { getSession } from "./session";
import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(2, "Project name must be at least 2 characters long."),
    key: z.string().min(2, "Project key must be at least 2 characters long.").max(5, "Project key must be 5 characters or less.").regex(/^[A-Z0-9]+$/, "Key must be uppercase letters and numbers."),
    type: z.enum(["KANBAN", "SCRUM"]),
    organizationId: z.string(),
});

export async function createProject(values: z.infer<typeof createProjectSchema>) {
    const user = await getSession();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const validatedValues = createProjectSchema.parse(values);

        // Check for unique project key within the organization
        const existingProject = await db.project.findFirst({
            where: {
                key: validatedValues.key,
                organizationId: validatedValues.organizationId
            }
        });

        if (existingProject) {
            return { success: false, error: "Project key must be unique within the organization." };
        }

        const project = await db.$transaction(async (prisma) => {
            const newProject = await prisma.project.create({
                data: {
                    name: validatedValues.name,
                    key: validatedValues.key,
                    type: validatedValues.type,
                    organizationId: validatedValues.organizationId,
                    leadId: user.id, // Set creator as lead
                }
            });

            // Create default statuses
            let statusesToCreate: { name: string; category: 'TODO' | 'IN_PROGRESS' | 'DONE'; order: number; projectId: string }[];

            if (newProject.type === 'SCRUM') {
                statusesToCreate = [
                    { name: 'To Do', category: 'TODO', order: 1, projectId: newProject.id },
                    { name: 'In Progress', category: 'IN_PROGRESS', order: 2, projectId: newProject.id },
                    { name: 'Done', category: 'DONE', order: 3, projectId: newProject.id },
                ];
            } else { // KANBAN
                statusesToCreate = [
                    { name: 'Backlog', category: 'TODO', order: 1, projectId: newProject.id },
                    { name: 'In Progress', category: 'IN_PROGRESS', order: 2, projectId: newProject.id },
                    { name: 'In Review', category: 'IN_PROGRESS', order: 3, projectId: newProject.id },
                    { name: 'Done', category: 'DONE', order: 4, projectId: newProject.id },
                ];
            }

            await prisma.status.createMany({
                data: statusesToCreate,
            });

            return newProject;
        });

        const org = await db.organization.findUnique({ where: { id: project.organizationId } });

        revalidatePath(`/${org?.slug}/${project.key}`);
        revalidatePath('/dashboard');

        return { success: true, project };

    } catch (error) {
        console.error("Failed to create project:", error);
        if (error instanceof z.ZodError) {
             return { success: false, error: "Invalid data provided." };
        }
        return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
    }
}


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
