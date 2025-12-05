
"use client";

import type { Issue, User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getIssueTypeIcon, getPriorityIcon } from "@/lib/utils";

type IssueWithAssignee = Issue & { assignee: User | null; reporter: User };

type BoardCardProps = {
    issue: IssueWithAssignee;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onClick: () => void;
}

export function BoardCard({ issue, onDragStart, onClick }: BoardCardProps) {
    const avatarPlaceholder = PlaceHolderImages.find(img => img.id === 'user-avatar');

    const assigneeFallback = issue.assignee ? issue.assignee.name?.charAt(0).toUpperCase() : 'U';

    const IssueTypeIcon = getIssueTypeIcon(issue.type);
    const PriorityIcon = getPriorityIcon(issue.priority);

    const issueTypeColorClasses: Record<Issue['type'], string> = {
        STORY: 'text-green-500',
        TASK: 'text-blue-500',
        BUG: 'text-red-500',
        EPIC: 'text-purple-500',
    };

    const priorityColorClasses: Record<Issue['priority'], string> = {
        NONE: 'text-gray-400',
        LOW: 'text-green-500',
        MEDIUM: 'text-yellow-500',
        HIGH: 'text-orange-500',
        CRITICAL: 'text-red-500',
    };

    return (
        <Card 
            draggable 
            onDragStart={onDragStart}
            onClick={onClick}
            className="cursor-pointer active:cursor-grabbing hover:bg-muted/80 transition-colors"
        >
            <CardContent className="p-3">
                <p className="text-sm mb-2 font-medium">{issue.title}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <IssueTypeIcon className={`h-4 w-4 ${issueTypeColorClasses[issue.type]}`} />
                                </TooltipTrigger>
                                <TooltipContent><p>{issue.type}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger>
                                    <PriorityIcon className={`h-4 w-4 ${priorityColorClasses[issue.priority]}`} />
                                </TooltipTrigger>
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
