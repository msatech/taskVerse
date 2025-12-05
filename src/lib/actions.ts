
'use server'

import { revalidatePath } from "next/cache";
import db from "./db";
import { getSession } from "./session";
import { z } from "zod";
import { createProjectActionSchema, createIssueSchema, inviteMemberSchema } from "./validators";
import { randomBytes } from "crypto";

export async function createProject(values: z.infer<typeof createProjectActionSchema>) {
    const user = await getSession();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const validatedValues = createProjectActionSchema.parse(values);

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
                    { name: 'Selected for Development', category: 'TODO', order: 2, projectId: newProject.id },
                    { name: 'In Progress', category: 'IN_PROGRESS', order: 3, projectId: newProject.id },
                    { name: 'Done', category: 'DONE', order: 4, projectId: newProject.id },
                ];
            }

            await prisma.status.createMany({
                data: statusesToCreate,
            });

            await prisma.activityLog.create({
                data: {
                    organizationId: newProject.organizationId,
                    actorId: user.id,
                    type: "PROJECT_CREATED",
                    message: `Project '${newProject.name}' was created`,
                }
            });

            return newProject;
        });

        const org = await db.organization.findUnique({ where: { id: project.organizationId } });

        if (org) {
            revalidatePath(`/${org.slug}/${project.key}`);
            revalidatePath('/dashboard');
        }
        
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
       return { success: false, error: "Not authenticated" };
    }

    try {
        const issue = await db.issue.findUnique({
            where: { id: issueId },
            include: { project: true, status: true }
        });

        if (!issue) {
             return { success: false, error: "Issue not found" };
        }
        
        const newStatus = await db.status.findUnique({ where: { id: statusId }});
        if (!newStatus) {
            return { success: false, error: "Status not found" };
        }


        const orgMember = await db.organizationMember.findFirst({
            where: {
                userId: user.id,
                organizationId: issue.project.organizationId,
            }
        });

        if (!orgMember) {
             return { success: false, error: "Not authorized" };
        }

        await db.issue.update({
            where: { id: issueId },
            data: { statusId },
        });

        await db.activityLog.create({
            data: {
                organizationId: issue.project.organizationId,
                issueId: issue.id,
                actorId: user.id,
                type: 'STATUS_CHANGED',
                message: `Status changed from ${issue.status.name} to ${newStatus.name}`
            }
        })

        revalidatePath(`/${orgSlug}/${projectKey}/board`);
        revalidatePath(`/${orgSlug}/${projectKey}`);
        
        return { success: true };
    } catch (error) {
        console.error("Failed to update issue status:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function createComment(issueId: string, body: string, orgSlug: string, projectKey: string, mentionedUserIds: string[] = []) {
    const user = await getSession();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    if (!body.trim()) {
        return { success: false, error: "Comment body cannot be empty" };
    }

    try {
        const issue = await db.issue.findUnique({
            where: { id: issueId },
            include: { project: true }
        });

        if (!issue) {
            return { success: false, error: "Issue not found" };
        }

        const orgMember = await db.organizationMember.findFirst({
            where: {
                userId: user.id,
                organizationId: issue.project.organizationId,
            }
        });

        if (!orgMember) {
            return { success: false, error: "Not authorized" };
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

        const activityLogs = [];

        // Log comment activity
        const commentActivity = await db.activityLog.create({
            data: {
                organizationId: issue.project.organizationId,
                issueId: issue.id,
                actorId: user.id,
                type: 'COMMENT_ADDED',
                message: `commented on issue ${issue.key}`,
                metadata: { body }
            }
        });
        activityLogs.push(commentActivity);

        // If one user mentioned, assign them
        if (mentionedUserIds.length === 1) {
            const assigneeId = mentionedUserIds[0];
            if (issue.assigneeId !== assigneeId) {
                await db.issue.update({ where: { id: issue.id }, data: { assigneeId }});
                const assignee = await db.user.findUnique({ where: { id: assigneeId } });
                if (assignee) {
                    const assignActivity = await db.activityLog.create({
                        data: {
                            organizationId: issue.project.organizationId,
                            issueId: issue.id,
                            actorId: user.id,
                            type: 'ASSIGNEE_CHANGED',
                            message: `assigned this issue to ${assignee.name} via comment`
                        }
                    });
                    activityLogs.push(assignActivity);
                }
            }
        }
        
        revalidatePath(`/api/issues/${issueId}`);
        revalidatePath(`/${orgSlug}/${projectKey}/board`);
        
        return { success: true, comment, activityLogs };
    } catch (error) {
        console.error("Failed to create comment:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function updateIssue(issueId: string, data: any, orgSlug: string, projectKey: string, activityMessage?: string) {
    const user = await getSession();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const issue = await db.issue.findUnique({ where: { id: issueId }, include: { project: true, assignee: true } });
        if (!issue) return { success: false, error: "Issue not found" };

        const orgMember = await db.organizationMember.findFirst({
            where: { userId: user.id, organizationId: issue.project.organizationId }
        });
        if (!orgMember) return { success: false, error: "Not authorized" };

        const updatedIssue = await db.issue.update({
            where: { id: issueId },
            data,
        });

        let activityLog = null;
        if ('assigneeId' in data) {
            const newAssignee = data.assigneeId ? await db.user.findUnique({ where: { id: data.assigneeId }}) : null;
            const oldAssigneeName = issue.assignee?.name || 'Unassigned';
            const newAssigneeName = newAssignee?.name || 'Unassigned';
            
            if(oldAssigneeName !== newAssigneeName) {
                activityLog = await db.activityLog.create({
                    data: {
                        organizationId: issue.project.organizationId,
                        issueId: issue.id,
                        actorId: user.id,
                        type: 'ASSIGNEE_CHANGED',
                        message: activityMessage || `changed the assignee from ${oldAssigneeName} to ${newAssigneeName}`
                    }
                });
            }
        }


        revalidatePath(`/${orgSlug}/${projectKey}/board`);
        revalidatePath(`/${orgSlug}/${projectKey}/backlog`);
        revalidatePath(`/api/issues/${issueId}`);
        
        return { success: true, issue: updatedIssue, activityLog };

    } catch (error) {
        console.error("Failed to update issue:", error);
        return { success: false, error: "An unknown error occurred" };
    }
}

export async function createIssue(values: z.infer<typeof createIssueSchema>, orgSlug: string) {
    const user = await getSession();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const validatedValues = createIssueSchema.parse(values);

        const project = await db.project.findUnique({
            where: { id: validatedValues.projectId },
            include: { issues: { select: { key: true } } }
        });
        if (!project) return { success: false, error: "Project not found" };

        const orgMember = await db.organizationMember.findFirst({
            where: { userId: user.id, organizationId: project.organizationId }
        });
        if (!orgMember) return { success: false, error: "Not authorized" };

        const lastIssue = await db.issue.findFirst({
            where: { projectId: project.id },
            orderBy: { createdAt: 'desc' },
            select: { key: true }
        });
        
        const lastIssueNumber = lastIssue ? parseInt(lastIssue.key.split('-')[1]) : 0;
        const newIssueKey = `${project.key}-${lastIssueNumber + 1}`;

        const issue = await db.issue.create({
            data: {
                ...validatedValues,
                key: newIssueKey,
                reporterId: user.id,
            },
            include: {
                assignee: true,
                reporter: true,
                status: true,
                _count: {
                    select: { comments: true }
                }
            }
        });

        await db.activityLog.create({
            data: {
                organizationId: project.organizationId,
                issueId: issue.id,
                actorId: user.id,
                type: "ISSUE_CREATED",
                message: `created issue ${issue.key}`,
            }
        });

        revalidatePath(`/${orgSlug}/${project.key}/board`);
        revalidatePath(`/${orgSlug}/${project.key}/backlog`);

        return { success: true, issue };

    } catch (error) {
        console.error("Failed to create issue:", error);
        if (error instanceof z.ZodError) {
             return { success: false, error: "Invalid data provided." };
        }
        return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
    }
}

export async function inviteMember(values: z.infer<typeof inviteMemberSchema>) {
    const user = await getSession();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const validatedValues = inviteMemberSchema.parse(values);

        const org = await db.organization.findUnique({
            where: { id: validatedValues.organizationId },
            include: { members: { include: { user: true } } }
        });

        if (!org) {
            return { success: false, error: "Organization not found" };
        }

        const currentUserMember = org.members.find(m => m.userId === user.id);
        if (!currentUserMember || !['OWNER', 'ADMIN'].includes(currentUserMember.role)) {
            return { success: false, error: "You do not have permission to invite members." };
        }

        if (org.members.some(m => m.user.email === validatedValues.email)) {
            return { success: false, error: "This user is already a member of the organization." };
        }

        // TODO: In a real app, you would send an email with the link.
        // For now, we'll just create the invitation and log the link.
        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const invitation = await db.invitation.create({
            data: {
                email: validatedValues.email,
                organizationId: validatedValues.organizationId,
                token,
                expires
            }
        });

        const inviteLink = `/invite/${token}`;
        console.log(`Generated invite link for ${validatedValues.email}: ${inviteLink}`);
        
        await db.activityLog.create({
            data: {
                organizationId: org.id,
                actorId: user.id,
                type: 'MEMBER_INVITED',
                message: `Invited ${validatedValues.email} to the organization.`
            }
        });

        revalidatePath(`/`, 'layout');

        return { success: true, message: `Invitation sent to ${validatedValues.email}.` };

    } catch (error) {
        console.error("Failed to invite member:", error);
        if (error instanceof z.ZodError) {
             return { success: false, error: "Invalid data provided." };
        }
        return { success: false, error: "An unknown error occurred." };
    }
}

