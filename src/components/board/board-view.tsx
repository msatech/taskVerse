
"use client";

import type { Issue, Project, Status, User } from "@prisma/client";
import { useEffect, useState } from "react";
import { BoardColumn } from "./board-column";
import { IssueDetails } from "./issue-details";
import { updateIssueStatus } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

type IssueFull = Issue & { assignee: User | null; reporter: User, status: Status };
type BoardViewProps = {
  project: Project & { organization: { slug: string } };
  statuses: Status[];
  issues: IssueFull[];
  users: User[];
};

type BoardState = {
  [key: string]: IssueFull[];
};

export function BoardView({ project, statuses, issues: initialIssues, users }: BoardViewProps) {
  const [boardState, setBoardState] = useState<BoardState>({});
  const [selectedIssue, setSelectedIssue] = useState<IssueFull | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initialState: BoardState = {};
    for (const status of statuses) {
      initialState[status.id] = [];
    }
    for (const issue of initialIssues) {
      if (initialState[issue.statusId]) {
        initialState[issue.statusId].push(issue);
      }
    }
    setBoardState(initialState);
  }, [statuses, initialIssues]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, issueId: string, fromStatusId: string) => {
    e.dataTransfer.setData("issueId", issueId);
    e.dataTransfer.setData("fromStatusId", fromStatusId);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toStatusId: string) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData("issueId");
    const fromStatusId = e.dataTransfer.getData("fromStatusId");

    if (issueId && fromStatusId && fromStatusId !== toStatusId) {
      const fromColumn = [...(boardState[fromStatusId] || [])];
      const issueIndex = fromColumn.findIndex(issue => issue.id === issueId);
      if (issueIndex === -1) return;

      const [movedIssue] = fromColumn.splice(issueIndex, 1);
      
      const newStatus = statuses.find(s => s.id === toStatusId);
      if (!newStatus) return;

      const updatedIssue = { ...movedIssue, statusId: toStatusId, status: newStatus };
      const originalBoardState = { ...boardState };

      // Optimistic update
      setBoardState(prevState => {
        const newFromColumn = [...(prevState[fromStatusId] || [])].filter(i => i.id !== issueId);
        const newToColumn = [...(prevState[toStatusId] || []), updatedIssue];
        return {
          ...prevState,
          [fromStatusId]: newFromColumn,
          [toStatusId]: newToColumn,
        };
      });

      try {
        const result = await updateIssueStatus(issueId, toStatusId, project.organization.slug, project.key);
        if (!result.success) {
          throw new Error(result.error);
        }
        toast({
          title: "Issue updated",
          description: `Moved ${movedIssue.key} to ${newStatus.name}.`,
        });
      } catch (error) {
        // Revert on failure
        setBoardState(originalBoardState);
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error instanceof Error ? error.message : "Could not update issue status.",
        });
      }
    }
  };


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCardClick = (issue: IssueFull) => {
    setSelectedIssue(issue);
  };

  const handleIssueUpdate = (updatedIssue: Partial<IssueFull>) => {
     setBoardState(prevState => {
        const newState = {...prevState};
        for (const statusId in newState) {
            const issueIndex = newState[statusId].findIndex(i => i.id === updatedIssue.id);
            if (issueIndex > -1) {
                // If status was changed, move the issue
                if (updatedIssue.statusId && updatedIssue.statusId !== statusId) {
                    const [movedIssue] = newState[statusId].splice(issueIndex, 1);
                    const newColumn = newState[updatedIssue.statusId] || [];
                    newState[updatedIssue.statusId] = [...newColumn, { ...movedIssue, ...updatedIssue }];
                } else {
                    newState[statusId][issueIndex] = { ...newState[statusId][issueIndex], ...updatedIssue };
                }
                break;
            }
        }
        return newState;
     });
     if (selectedIssue && selectedIssue.id === updatedIssue.id) {
         setSelectedIssue(prev => prev ? {...prev, ...updatedIssue} : null);
     }
  }
  
    const onIssueCreated = (newIssue: IssueFull) => {
        setBoardState(prevState => {
            const newColumn = [...(prevState[newIssue.statusId] || []), newIssue];
            return {
                ...prevState,
                [newIssue.statusId]: newColumn,
            };
        });
    }

  return (
    <>
      <div className="flex gap-4 h-full items-start">
        {statuses.map(status => (
          <BoardColumn
            key={status.id}
            status={status}
            issues={boardState[status.id] || []}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
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
    </>
  );
}
