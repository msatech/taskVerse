"use client";

import type { Issue, Status, User } from "@prisma/client";
import { BoardCard } from "./board-card";

type IssueWithAssignee = Issue & { assignee: User | null, reporter: User };

type BoardColumnProps = {
    status: Status;
    issues: IssueWithAssignee[];
    onDragStart: (e: React.DragEvent<HTMLDivElement>, issueId: string, fromStatusId: string) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, toStatusId: string) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onCardClick: (issue: IssueWithAssignee) => void;
}

export function BoardColumn({ status, issues, onDragStart, onDrop, onDragOver, onCardClick }: BoardColumnProps) {
    return (
        <div
            className="flex flex-col w-72 md:w-80 flex-shrink-0"
            onDrop={(e) => onDrop(e, status.id)}
            onDragOver={onDragOver}
        >
            <div className="flex items-center justify-between p-2 mb-2">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground">{status.name}</h3>
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">{issues.length}</span>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2 space-y-2 min-h-[200px] flex-1">
                {issues.map(issue => (
                    <BoardCard 
                        key={issue.id} 
                        issue={issue} 
                        onDragStart={(e) => onDragStart(e, issue.id, status.id)} 
                        onClick={() => onCardClick(issue)}
                    />
                ))}
            </div>
        </div>
    );
}
