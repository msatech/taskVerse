
"use client";

import { useEffect, useState, useTransition } from "react";
import type { Issue, User, Status, Comment } from "@prisma/client";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  ArrowUp,
  Bug,
  CheckCircle,
  ChevronsUp,
  Type as TypeIcon,
  User as UserIcon,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { createComment } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";


type DetailedIssue = Issue & {
  assignee: User | null;
  reporter: User;
  status: Status;
  comments: (Comment & { author: User })[];
};

type IssueDetailsProps = {
  issueId: string;
  projectUsers: User[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onIssueUpdate: (issue: Partial<DetailedIssue>) => void;
};

const issueTypeIcons: Record<Issue["type"], React.ElementType> = {
  STORY: CheckCircle,
  TASK: TypeIcon,
  BUG: Bug,
  EPIC: ChevronsUp,
};

const priorityIcons: Record<Issue["priority"], React.ElementType> = {
  NONE: ArrowDown,
  LOW: ArrowDown,
  MEDIUM: ArrowUp,
  HIGH: ArrowUp,
  CRITICAL: ArrowUp,
};

const priorityColors: Record<Issue["priority"], string> = {
    NONE: "text-muted-foreground",
    LOW: "text-green-500",
    MEDIUM: "text-yellow-500",
    HIGH: "text-orange-500",
    CRITICAL: "text-red-500",
}

export function IssueDetails({ issueId, isOpen, onOpenChange, onIssueUpdate }: IssueDetailsProps) {
  const [issue, setIssue] = useState<DetailedIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
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
    startTransition(async () => {
        const result = await createComment(issueId, values.body, orgSlug as string, projectKey as string);
        if (result.success && result.comment) {
            setIssue(prev => prev ? ({ ...prev, comments: [...prev.comments, result.comment as any] }) : null);
            form.reset();
            toast({ title: "Comment added" });
        } else {
            toast({ variant: "destructive", title: "Error", description: "Could not add comment." });
        }
    });
  }

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

  const renderUser = (user: User | null) => {
    if (!user) return <span className="text-muted-foreground">Unassigned</span>;
    const fallback = user.name ? user.name.charAt(0).toUpperCase() : "U";
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={user.avatarUrl || avatarPlaceholder?.imageUrl} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <span>{user.name}</span>
      </div>
    );
  };
  
  const PriorityIcon = issue ? priorityIcons[issue.priority] : null;
  const TypeIcon = issue ? issueTypeIcons[issue.type] : null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-2xl p-0 sm:max-w-3xl lg:max-w-4xl">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3">
                 <div className="lg:col-span-2 space-y-6 p-6">
                    <Skeleton className="h-8 w-3/4" />
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
                     <Skeleton className="h-6 w-20" />
                     <div className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">
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
                                {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
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
                                    <Button type="submit" size="sm" disabled={isPending}>
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  {renderField(TypeIcon!, "Type", <Badge variant="secondary">{issue.type}</Badge>)}
                  {renderField(priorityIcons.HIGH, "Status", <Badge>{issue.status.name}</Badge>)}
                  {renderField(UserIcon, "Assignee", renderUser(issue.assignee))}
                  {renderField(UserIcon, "Reporter", renderUser(issue.reporter))}
                  {PriorityIcon && renderField(PriorityIcon, "Priority", <span className={priorityColors[issue.priority]}>{issue.priority}</span>)}
                  {renderField(Calendar, "Due Date", issue.dueDate ? format(new Date(issue.dueDate), "MMM d, yyyy") : "None")}
                  <Separator />
                   {renderField(Clock, "Created", format(new Date(issue.createdAt), "MMM d, yyyy"))}
                   {renderField(Clock, "Updated", format(new Date(issue.updatedAt), "MMM d, yyyy"))}
                </div>
              </div>
            </div>
          ) : <p className="p-8 text-center text-muted-foreground">Could not load issue details.</p>}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
