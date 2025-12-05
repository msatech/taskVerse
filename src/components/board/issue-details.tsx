
"use client";

import * as React from "react";
import { useEffect, useState, useTransition, useRef } from "react";
import type { Issue, User, Status, Comment, ActivityLog } from "@prisma/client";
import { format, formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  User as UserIcon,
  Calendar,
  Clock,
  Loader2,
  Pencil,
  Type,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { createComment, updateIssue } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { getPriorityIcon, getIssueTypeIcon, getPriorityColorClass, getActivityLogIcon, getActivityLogMessage } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


type DetailedIssue = Issue & {
  assignee: User | null;
  reporter: User;
  status: Status;
  comments: (Comment & { author: User })[];
  activityLogs: (ActivityLog & { actor: User })[];
};

type IssueDetailsProps = {
  issueId: string;
  projectUsers: User[];
  statuses: Status[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onIssueUpdate: (issue: Partial<DetailedIssue>) => void;
};


// New standalone component for user fields
type IssueUserFieldProps = {
  field: 'assigneeId' | 'reporterId';
  user: User | null;
  projectUsers: User[];
  onUpdate: (field: keyof Issue, value: any) => void;
  disabled?: boolean;
}

function IssueUserField({ field, user, projectUsers, onUpdate, disabled = false }: IssueUserFieldProps) {
  const avatarPlaceholder = PlaceHolderImages.find((img) => img.id === "user-avatar");
  
  const UserDisplay = () => (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={user?.avatarUrl || avatarPlaceholder?.imageUrl} />
        <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
      </Avatar>
      <span>{user?.name || 'Unassigned'}</span>
    </div>
  );

  if (disabled) {
    return <UserDisplay />;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto p-1 -m-1">
          <UserDisplay />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Change {field === 'assigneeId' ? 'assignee' : 'reporter'}</p>
          <Select onValueChange={(userId) => onUpdate(field, userId === 'unassigned' ? null : userId)} defaultValue={user?.id || 'unassigned'}>
            <SelectTrigger>
              <SelectValue placeholder={`Select a user...`} />
            </SelectTrigger>
            <SelectContent>
              {field === 'assigneeId' && <SelectItem value="unassigned">Unassigned</SelectItem>}
              {projectUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}


export function IssueDetails({ issueId, projectUsers, statuses, isOpen, onOpenChange, onIssueUpdate }: IssueDetailsProps) {
  const [issue, setIssue] = useState<DetailedIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentPending, startCommentTransition] = useTransition();
  const { toast } = useToast();
  const params = useParams();
  const { orgSlug, projectKey } = params;

  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const form = useForm({
    defaultValues: {
      body: "",
    },
  });

  useEffect(() => {
    async function fetchIssueDetails() {
      if (!isOpen || !issueId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/issues/${issueId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch issue details");
        }
        const data = await response.json();
        setIssue(data);
      } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load issue details."
        })
      } finally {
        setIsLoading(false);
      }
    }

    fetchIssueDetails();
  }, [isOpen, issueId, toast]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@') {
      setShowMentionPopover(true);
    }
  };

  const handleMentionSelect = (user: User) => {
    const textarea = textareaRef.current;
    if (textarea) {
        const cursorPosition = textarea.selectionStart;
        const text = textarea.value;
        const textBeforeCursor = text.substring(0, cursorPosition);
        const textAfterCursor = text.substring(cursorPosition);
        
        const atIndex = textBeforeCursor.lastIndexOf('@');
        if (atIndex !== -1) {
            const newText = text.substring(0, atIndex) + `@${user.name} ` + textAfterCursor;
            form.setValue('body', newText);
        }
    }
    setShowMentionPopover(false);
  };

  const onSubmitComment = (values: { body: string }) => {
    const mentionRegex = /@(\w+(\s\w+)*)/g;
    let match;
    const mentions = [];
    while ((match = mentionRegex.exec(values.body)) !== null) {
        mentions.push(match[1].trim());
    }

    const mentionedUsers = projectUsers.filter(u => mentions.includes(u.name));
    
    startCommentTransition(async () => {
        const result = await createComment(
            issueId, 
            values.body, 
            orgSlug as string, 
            projectKey as string,
            mentionedUsers.map(u => u.id)
        );
        if (result.success && result.comment) {
            setIssue(prev => prev ? ({ 
              ...prev, 
              comments: [...prev.comments, result.comment as any],
              activityLogs: result.activityLogs ? [...prev.activityLogs, ...result.activityLogs as any] : prev.activityLogs
            }) : null);
            
            // Handle assignment if one user was mentioned
            if (mentionedUsers.length === 1) {
                const assigneeId = mentionedUsers[0].id;
                if (issue?.assigneeId !== assigneeId) {
                    await handleFieldUpdate('assigneeId', assigneeId, `Assigned to ${mentionedUsers[0].name} via comment.`);
                }
            }

            form.reset();
            toast({ title: "Comment added" });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error || "Could not add comment." });
        }
    });
  }

  const handleFieldUpdate = async (field: keyof Issue, value: any, activityMessage?: string) => {
    if (!issue) return;

    const originalIssue = {...issue};
    const updatedData = { [field]: value };
    
    // Optimistic update
    let updatedIssue: DetailedIssue = { ...issue, ...updatedData };
    
    if (field === 'statusId') {
        const newStatus = statuses.find(s => s.id === value);
        if (newStatus) updatedIssue.status = newStatus;
    }
     if (field === 'assigneeId') {
        const newAssignee = projectUsers.find(u => u.id === value);
        updatedIssue.assignee = newAssignee || null;
    }

    setIssue(updatedIssue);
    onIssueUpdate(updatedIssue);
    
    try {
        const result = await updateIssue(issue.id, updatedData, orgSlug as string, projectKey as string, activityMessage);
        if (!result.success) {
            throw new Error(result.error);
        }
        if (result.activityLog) {
            setIssue(prev => prev ? ({...prev, activityLogs: [...prev.activityLogs, result.activityLog as any]}) : null);
        }
        toast({
            title: "Issue updated"
        });
    } catch (error) {
        setIssue(originalIssue); // Revert on failure
        onIssueUpdate(originalIssue);
        toast({
            variant: "destructive",
            title: "Update failed",
            description: error instanceof Error ? error.message : "Could not update issue."
        });
    }
  };

  const renderField = (icon: React.ElementType, label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {React.createElement(icon, { className: "h-4 w-4" })}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
  
  const IssueTypeIcon = issue ? getIssueTypeIcon(issue.type) : Type;
  const PriorityIcon = issue ? getPriorityIcon(issue.priority) : Plus;


  const combinedActivity = [
      ...(issue?.comments.map(c => ({...c, type: 'COMMENT' as const})) || []),
      ...(issue?.activityLogs.map(a => ({...a, type: a.type as const})) || [])
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-2xl p-0 sm:max-w-3xl lg:max-w-4xl" side="right">
        <ScrollArea className="h-full">
          {isLoading ? (
             <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                <div className="lg:col-span-2 space-y-6 p-6">
                    <SheetHeader>
                        <SheetTitle>
                            <Skeleton className="h-8 w-1/2" />
                        </SheetTitle>
                    </SheetHeader>
                    <div className="pt-4 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                    <Separator />
                    <div className="pt-4 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-4 border-l bg-secondary/50 p-6">
                    <h3 className="text-lg font-semibold">Details</h3>
                    <div className="space-y-4 pt-2">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                </div>
            </div>
          ) : issue ? (
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6 p-6">
                <SheetHeader className="text-left">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <IssueTypeIcon className="h-4 w-4" />
                       <span>{issue.key}</span>
                   </div>
                  <SheetTitle className="text-2xl font-bold font-headline">
                    {issue.title}
                  </SheetTitle>
                </SheetHeader>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {issue.description || "No description provided."}
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Activity</h3>
                  <div className="space-y-4">
                     <div className="flex items-start gap-3 pt-4">
                        <Avatar className="h-8 w-8">
                           <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitComment)} className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="body"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea 
                                                        ref={textareaRef}
                                                        placeholder="Add a comment... type '@' to mention a user." 
                                                        {...field}
                                                        onKeyDown={handleTextareaKeyDown}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" size="sm" disabled={isCommentPending}>
                                        {isCommentPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Comment
                                    </Button>
                                </form>
                            </Form>
                            {showMentionPopover && (
                                <div className="absolute z-10 w-full bg-card border rounded-md shadow-lg mt-1">
                                    <Command>
                                        {projectUsers.map(user => (
                                            <Command.Item key={user.id} onSelect={() => handleMentionSelect(user)}>
                                                {user.name}
                                            </Command.Item>
                                        ))}
                                    </Command>
                                </div>
                            )}
                        </div>
                    </div>
                    {combinedActivity.length > 0 ? (
                      combinedActivity.map((activity, index) => {
                        if (activity.type === 'COMMENT') {
                            const comment = activity as (Comment & { author: User });
                            return (
                                <div key={`comment-${comment.id}`} className="flex items-start gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.author.avatarUrl || PlaceHolderImages.find(img => img.id === 'user-avatar')?.imageUrl} />
                                    <AvatarFallback>{comment.author.name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 rounded-md border bg-card p-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">{comment.author.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        commented {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-sm mt-1">{comment.body}</p>
                                  </div>
                                </div>
                            )
                        } else {
                            const log = activity as (ActivityLog & { actor: User });
                            const LogIcon = getActivityLogIcon(log.type);
                            return (
                                <div key={`log-${log.id}`} className="flex items-start gap-3">
                                    <div className="h-8 w-8 flex items-center justify-center">
                                        <LogIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 text-sm text-muted-foreground pt-1.5">
                                        <span className="font-semibold text-foreground">{log.actor.name}</span>
                                        {' '}
                                        {getActivityLogMessage(log)}
                                        {' '}
                                        <span className="text-xs">
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            )
                        }
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 space-y-4 border-l bg-secondary/50 p-6">
                <h3 className="text-lg font-semibold">Details</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Pencil className="h-4 w-4" />
                            <span>Status</span>
                         </div>
                         <Select onValueChange={(statusId) => handleFieldUpdate('statusId', statusId)} defaultValue={issue.statusId}>
                            <SelectTrigger className="text-sm font-medium h-auto p-1.5">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                         </Select>
                    </div>
                  
                  {renderField(UserIcon, "Assignee", 
                      <IssueUserField 
                        field="assigneeId"
                        user={issue.assignee}
                        projectUsers={projectUsers}
                        onUpdate={handleFieldUpdate}
                      />
                  )}
                  {renderField(UserIcon, "Reporter", 
                      <IssueUserField 
                        field="reporterId"
                        user={issue.reporter}
                        projectUsers={projectUsers}
                        onUpdate={handleFieldUpdate}
                        disabled
                      />
                  )}
                   {renderField(PriorityIcon, "Priority", (
                    <Select onValueChange={(priority) => handleFieldUpdate('priority', priority)} defaultValue={issue.priority}>
                        <SelectTrigger className={`text-sm font-medium h-auto p-1.5 ${getPriorityColorClass(issue.priority)} border-none`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="NONE">None</SelectItem>
                           <SelectItem value="LOW">Low</SelectItem>
                           <SelectItem value="MEDIUM">Medium</SelectItem>
                           <SelectItem value="HIGH">High</SelectItem>
                           <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                   ))}
                  {renderField(Calendar, "Due Date", issue.dueDate ? format(new Date(issue.dueDate), "MMM d, yyyy") : "None")}
                  <Separator />
                   {renderField(Clock, "Created", formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true }))}
                   {renderField(Clock, "Updated", formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true }))}
                </div>
              </div>
            </div>
          ) : <p className="p-8 text-center text-muted-foreground">Could not load issue details.</p>}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
