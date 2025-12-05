
"use client";

import * as React from "react";
import { useEffect, useState, useTransition } from "react";
import type { Issue, User, Status, Comment } from "@prisma/client";
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
  ArrowDown,
  User as UserIcon,
  Calendar,
  Clock,
  Loader2,
  Pencil,
  Type
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { createComment, updateIssue } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { getPriorityIcon, getIssueTypeIcon, getPriorityColorClass } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


type DetailedIssue = Issue & {
  assignee: User | null;
  reporter: User;
  status: Status;
  comments: (Comment & { author: User })[];
};

type IssueDetailsProps = {
  issueId: string;
  projectUsers: User[];
  statuses: Status[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onIssueUpdate: (issue: Partial<DetailedIssue>) => void;
};


export function IssueDetails({ issueId, projectUsers, statuses, isOpen, onOpenChange, onIssueUpdate }: IssueDetailsProps) {
  const [issue, setIssue] = useState<DetailedIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentPending, startCommentTransition] = useTransition();
  const { toast } = useToast();
  const params = useParams();
  const { orgSlug, projectKey } = params;

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

  const onSubmitComment = (values: { body: string }) => {
    startCommentTransition(async () => {
        const result = await createComment(issueId, values.body, orgSlug as string, projectKey as string);
        if (result.success && result.comment) {
            setIssue(prev => prev ? ({ ...prev, comments: [...prev.comments, result.comment as any] }) : null);
            form.reset();
            toast({ title: "Comment added" });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error || "Could not add comment." });
        }
    });
  }

  const handleFieldUpdate = async (field: keyof Issue, value: any) => {
    if (!issue) return;

    const originalIssue = {...issue};
    const updatedData = { [field]: value };
    
    // Optimistic update
    const updatedIssue = { ...issue, ...updatedData };
    
    if (field === 'statusId') {
        const newStatus = statuses.find(s => s.id === value);
        if (newStatus) {
            updatedIssue.status = newStatus;
        }
    }
     if (field === 'assigneeId') {
        const newAssignee = projectUsers.find(u => u.id === value);
        updatedIssue.assignee = newAssignee || null;
    }


    setIssue(updatedIssue);
    onIssueUpdate(updatedIssue);
    
    try {
        const result = await updateIssue(issue.id, updatedData, orgSlug as string, projectKey as string);
        if (!result.success) {
            throw new Error(result.error);
        }
        toast({
            title: "Issue updated",
            description: `Issue ${field} has been changed.`
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

  const avatarPlaceholder = PlaceHolderImages.find((img) => img.id === "user-avatar");

  const renderField = (icon: React.ElementType, label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {React.createElement(icon, { className: "h-4 w-4" })}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );

  const renderUser = (user: User | null, field: 'assigneeId' | 'reporterId') => {
    if (!user && field === 'reporterId') return <span className="text-muted-foreground">Unknown</span>;

    const PopoverContentComponent = () => (
         <div className="space-y-2">
            <p className="text-sm font-semibold">Change {field === 'assigneeId' ? 'assignee' : 'reporter'}</p>
            <Select onValueChange={(userId) => handleFieldUpdate(field, userId)} defaultValue={user?.id}>
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
    );

    const UserDisplayComponent = () => (
        <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
            <AvatarImage src={user?.avatarUrl || avatarPlaceholder?.imageUrl} />
            <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
            <span>{user?.name || 'Unassigned'}</span>
        </div>
    );
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                 <Button variant="ghost" className="h-auto p-1 -m-1" disabled={field === 'reporterId'}>
                    <UserDisplayComponent />
                 </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2">
               <PopoverContentComponent />
            </PopoverContent>
        </Popover>
    )
  };
  
  const IssueTypeIcon = issue ? getIssueTypeIcon(issue.type) : Type;
  const PriorityIcon = issue ? getPriorityIcon(issue.priority) : ArrowDown;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-2xl p-0 sm:max-w-3xl lg:max-w-4xl" side="right">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
              <div className="lg:col-span-2 space-y-6 p-6">
                 <SheetHeader>
                  <SheetTitle>
                    <Skeleton className="h-8 w-3/4" />
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
                  <SheetTitle className="text-2xl font-bold font-headline">
                    {issue.key}: {issue.title}
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
                  <h3 className="mb-4 text-lg font-semibold">Comments</h3>
                  <div className="space-y-4">
                    {issue.comments.length > 0 ? (
                      issue.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatarUrl || avatarPlaceholder?.imageUrl} />
                            <AvatarFallback>{comment.author.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 rounded-md border bg-card p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{comment.author.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{comment.body}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                    )}
                     <div className="flex items-start gap-3 pt-4">
                        <Avatar className="h-8 w-8">
                           <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitComment)} className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="body"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea placeholder="Add a comment..." {...field} />
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
                        </div>
                    </div>
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
                  {renderField(IssueTypeIcon, "Type", 
                    <div className="flex items-center gap-2">
                        {React.createElement(IssueTypeIcon, {className: "h-4 w-4"})}
                        <span>{issue.type}</span>
                    </div>
                  )}
                  {renderField(UserIcon, "Assignee", renderUser(issue.assignee, 'assigneeId'))}
                  {renderField(UserIcon, "Reporter", renderUser(issue.reporter, 'reporterId'))}
                  {renderField(PriorityIcon, "Priority", 
                    <span className={`${getPriorityColorClass(issue.priority)} flex items-center gap-2`}>
                        {React.createElement(PriorityIcon, {className: "h-4 w-4"})}
                        {issue.priority}
                    </span>
                   )}
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
