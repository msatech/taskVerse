
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ArrowDown, ArrowUp, Bug, CheckCircle, ChevronsUp, Type, User, Users, MessageSquare, PlusCircle } from "lucide-react";
import type { Issue, ActivityLog } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getIssueTypeIcon = (issueType: Issue['type']) => {
    const issueTypeIcons: Record<Issue['type'], React.ElementType> = {
        STORY: CheckCircle,
        TASK: Type,
        BUG: Bug,
        EPIC: ChevronsUp
    };
    return issueTypeIcons[issueType];
}

export const getPriorityIcon = (priority: Issue['priority']) => {
    const priorityIcons: Record<Issue['priority'], React.ElementType> = {
        NONE: ArrowDown,
        LOW: ArrowDown,
        MEDIUM: ArrowUp,
        HIGH: ArrowUp,
        CRITICAL: ArrowUp
    };
    return priorityIcons[priority];
}

export const getPriorityColorClass = (priority: Issue['priority']) => {
    const priorityColors: Record<Issue['priority'], string> = {
        NONE: "text-muted-foreground",
        LOW: "text-green-500",
        MEDIUM: "text-yellow-500",
        HIGH: "text-orange-500",
        CRITICAL: "text-red-500",
    };
    return priorityColors[priority];
}

export function getActivityLogIcon(type: string): React.ElementType {
    switch (type) {
        case "ASSIGNEE_CHANGED":
            return User;
        case "MEMBER_INVITED":
            return Users;
        case "COMMENT_ADDED":
            return MessageSquare;
        case "ISSUE_CREATED":
            return PlusCircle;
        default:
            return CheckCircle;
    }
}

export function getActivityLogMessage(log: ActivityLog): string {
    return log.message;
}
