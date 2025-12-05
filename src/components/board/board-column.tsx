
"use client";

import type { Issue, Status, User } from "@prisma/client";
import { BoardCard } from "./board-card";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";

type IssueFull = Issue & { assignee: User | null; reporter: User; _count: { comments: number } };

type BoardColumnProps = {
    status: Status;
    issues: IssueFull[];
    onDragStart: (e: React.DragEvent<HTMLDivElement>, issueId: string, fromStatusId: string) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, toStatusId: string) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onCardClick: (issue: IssueFull) => void;
}

export function BoardColumn({ status, issues, onDragStart, onDrop, onDragOver, onCardClick }: BoardColumnProps) {
    return (
        <div
            className="flex flex-col w-80 flex-shrink-0"
            onDrop={(e) => onDrop(e, status.id)}
            onDragOver={onDragOver}
        >
            <div className="flex items-center justify-between p-2 mb-2 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">{status.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">{issues.length}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
            <div className="bg-secondary rounded-lg p-2 flex-1 min-h-[200px]">
                {issues.map(issue => (
                    <BoardCard 
                        key={issue.id} 
                        issue={issue} 
                        onDragStart={(e) => onDragStart(e, issue.id, status.id)} 
                        onClick={() => onCardClick(issue)}
                    />
                ))}
                 <Button variant="ghost" className="w-full justify-start mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Add new card
                </Button>
            </div>
        </div>
    );
}
