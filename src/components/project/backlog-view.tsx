
'use client';

import type { Issue, Project, Status, User } from '@prisma/client';
import { useState } from 'react';
import { BoardCard } from '../board/board-card';
import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { CreateIssueDialog } from './create-issue-dialog';
import { Card, CardContent } from '../ui/card';
import { IssueDetails } from '../board/issue-details';

type IssueFull = Issue & { assignee: User | null; reporter: User; status: Status; _count: { comments: number } };

type BacklogViewProps = {
    project: Project;
    issues: IssueFull[];
    statuses: Status[];
    users: User[];
}

export function BacklogView({ project, issues: initialIssues, statuses, users }: BacklogViewProps) {
    const [issues, setIssues] = useState(initialIssues);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueFull | null>(null);

    const onIssueCreated = (newIssue: IssueFull) => {
        setIssues(prev => [...prev, newIssue]);
        setSelectedIssue(newIssue);
    };
    
    const handleIssueUpdate = (updatedIssue: Partial<IssueFull>) => {
        setIssues(prevIssues => prevIssues.map(i => i.id === updatedIssue.id ? { ...i, ...updatedIssue as IssueFull } : i));
        if (selectedIssue && selectedIssue.id === updatedIssue.id) {
            setSelectedIssue(prev => prev ? {...prev, ...updatedIssue} as IssueFull : null);
        }
    }

    return (
        <>
            <CreateIssueDialog
                project={project}
                users={users}
                statuses={statuses}
                open={isCreating}
                onOpenChange={setIsCreating}
                onIssueCreated={onIssueCreated}
            />
             {selectedIssue && (
                <IssueDetails
                issueId={selectedIssue.id}
                projectUsers={users}
                statuses={statuses}
                isOpen={!!selectedIssue}
                onOpenChange={(open) => {
                    if (!open) {
                    setSelectedIssue(null);
                    }
                }}
                onIssueUpdate={handleIssueUpdate}
                />
            )}
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-4">
                        {issues.length > 0 ? (
                            <div className="space-y-2">
                                {issues.map(issue => (
                                    <BoardCard key={issue.id} issue={issue} onDragStart={() => {}} onClick={() => setSelectedIssue(issue)} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <h3 className="font-semibold text-lg">Your backlog is clear!</h3>
                                <p className="text-muted-foreground text-sm mt-1">Create an issue to start planning your work.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Button variant="ghost" onClick={() => setIsCreating(true)} className="text-muted-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create issue
                </Button>
            </div>
        </>
    );
}
