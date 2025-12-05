
import { z } from "zod";

export const issueTaggingSchema = z.object({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters long.",
  }),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const createProjectFormSchema = z.object({
    name: z.string().min(2, "Project name must be at least 2 characters long."),
    key: z.string().min(2, "Project key must be at least 2 characters long.").max(5, "Project key must be 5 characters or less.").regex(/^[A-Z0-9]+$/, "Key must be uppercase letters and numbers."),
    type: z.enum(["KANBAN", "SCRUM"]),
});

export const createProjectActionSchema = createProjectFormSchema.extend({
  organizationId: z.string(),
});

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  type: z.enum(["STORY", "TASK", "BUG", "EPIC"]),
  statusId: z.string().min(1, "Status is required."),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  assigneeId: z.string().optional().refine(val => val !== 'unassigned', { message: "Invalid assignee" }),
  projectId: z.string().min(1, "Project is required."),
});

export const inviteMemberSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email." }),
    organizationId: z.string(),
});


export type SignupFormValues = z.infer<typeof signupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;
export type CreateIssueFormValues = z.infer<typeof createIssueSchema>;
export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
