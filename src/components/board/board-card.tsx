"use client";

import type { Issue, User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Bug, CheckCircle, ArrowUp, ArrowDown, ChevronsUp, Type } from "lucide-react";

type IssueWithAssignee = Issue & { assignee: User | null; reporter: User };

type BoardCardProps = {
    issue: IssueWithAssignee;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onClick: () => void;
}

const issueTypeIcons: Record<Issue['type'], React.ReactNode> = {
    STORY: <CheckCircle className="h-4 w-4 text-green-500" />,
    TASK: <Type className="h-4 w-4 text-blue-500" />,
    BUG: <Bug className="h-4 w-4 text-red-500" />,
    EPIC: <ChevronsUp className="h-4 w-4 text-purple-500" />
};

const priorityIcons: Record<Issue['priority'], React.ReactNode> = {
    NONE: <ArrowDown className="h-4 w-4 text-gray-400" />,
    LOW: <ArrowDown className="h-4 w-4 text-green-500" />,
    MEDIUM: <ArrowUp className="h-4 w-4 text-yellow-500" />,
    HIGH: <ArrowUp className="h-4 w-4 text-orange-500" />,
    CRITICAL: <ArrowUp className="h-4 w-4 text-red-500" />
};

export function BoardCard({ issue, onDragStart, onClick }: BoardCardProps) {
    const avatarPlaceholder = PlaceHolderImages.find(img => img.id === 'user-avatar');

    const assigneeFallback = issue.assignee ? issue.assignee.name?.charAt(0).toUpperCase() : 'U';

    return (
        <Card 
            draggable 
            onDragStart={onDragStart}
            onClick={onClick}
            className="cursor-pointer active:cursor-grabbing"
        >
            <CardContent className="p-3">
                <p className="text-sm mb-2">{issue.title}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>{issueTypeIcons[issue.type]}</TooltipTrigger>
                                <TooltipContent><p>{issue.type}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger>{priorityIcons[issue.priority]}</TooltipTrigger>
                                <TooltipContent><p>{issue.priority}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs text-muted-foreground">{issue.key}</span>
                    </div>
                    {issue.assignee && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={issue.assignee.avatarUrl || avatarPlaceholder?.imageUrl} />
                                        <AvatarFallback>{assigneeFallback}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Assigned to {issue.assignee.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
