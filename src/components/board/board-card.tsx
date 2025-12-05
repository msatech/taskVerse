
"use client";

import type { Issue, User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getPriorityIcon, getPriorityColorClass } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { CalendarIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";

type IssueWithAssignee = Issue & { assignee: User | null; reporter: User; _count: { comments: number } };

type BoardCardProps = {
    issue: IssueWithAssignee;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onClick: () => void;
}

export function BoardCard({ issue, onDragStart, onClick }: BoardCardProps) {
    const avatarPlaceholder = PlaceHolderImages.find(img => img.id === 'user-avatar');
    const assigneeFallback = issue.assignee ? issue.assignee.name?.charAt(0).toUpperCase() : 'U';
    const PriorityIcon = getPriorityIcon(issue.priority);

    return (
        <Card 
            draggable 
            onDragStart={onDragStart}
            onClick={onClick}
            className="cursor-pointer active:cursor-grabbing hover:bg-muted/60 transition-colors mb-2"
        >
            <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                    <p className="text-sm font-medium pr-2">{issue.title}</p>
                    <Badge variant="outline" className="capitalize text-xs font-normal">{issue.type.toLowerCase()}</Badge>
                </div>
                 <div className="flex items-center gap-2">
                    <PriorityIcon className={`h-4 w-4 ${getPriorityColorClass(issue.priority)}`} />
                    <p className={`text-xs font-medium ${getPriorityColorClass(issue.priority)}`}>{issue.priority}</p>
                </div>
                {issue.description && <p className="text-sm text-muted-foreground line-clamp-2">{issue.description}</p>}
                
                {issue.dueDate && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{format(new Date(issue.dueDate), "MMM dd")}</span>
                    </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                    {issue.assignee ? (
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
                    ) : <div />}

                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{issue._count.comments}</span>
                     </div>
                </div>
            </CardContent>
        </Card>
    );
}
