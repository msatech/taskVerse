
'use client';

import type { Issue, Project, Status, User } from '@prisma/client';
import { useState, useTransition } from 'react';
import { BoardCard } from '../board/board-card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { createIssueSchema, type CreateIssueFormValues } from '@/lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { createIssue } from '@/lib/actions';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';


type IssueFull = Issue & { assignee: User | null; reporter: User; status: Status };

type BacklogViewProps = {
    project: Project;
    issues: IssueFull[];
    statuses: Status[];
    users: User[];
}

export function BacklogView({ project, issues: initialIssues, statuses, users }: BacklogViewProps) {
    const [issues, setIssues] = useState(initialIssues);
    const [isCreating, setIsCreating] = useState(false);
    const [isPending, startTransition] = useTransition();
    const params = useParams();
    const { toast } = useToast();

    const form = useForm<CreateIssueFormValues>({
        resolver: zodResolver(createIssueSchema),
        defaultValues: {
            title: '',
            projectId: project.id,
            type: "TASK",
            priority: 'MEDIUM',
            statusId: statuses.find(s => s.category === 'TODO')?.id || statuses[0].id,
        },
    });

    const onSubmit = (values: CreateIssueFormValues) => {
        startTransition(async () => {
            const result = await createIssue(values, params.orgSlug as string);
            if (result.success && result.issue) {
                setIssues(prev => [...prev, result.issue as IssueFull]);
                toast({ title: "Issue created" });
                form.reset();
                setIsCreating(false);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error creating issue",
                    description: result.error,
                });
            }
        });
    };

    return (
        <div className="space-y-4">
            <Card>
                <div className="p-4">
                    {issues.length > 0 ? (
                        <div className="space-y-2">
                            {issues.map(issue => (
                                <BoardCard key={issue.id} issue={issue} onDragStart={() => {}} onClick={() => {}} />
                            ))}
                        </div>
                    ) : (
                        !isCreating && (
                            <div className="text-center py-12">
                                <h3 className="font-semibold text-lg">Your backlog is empty</h3>
                                <p className="text-muted-foreground text-sm mt-1">Create an issue to get started.</p>
                            </div>
                        )
                    )}

                    {isCreating && (
                        <div className="p-2 border rounded-lg bg-background">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="What needs to be done?" {...field} className="text-base" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FormField
                                                control={form.control}
                                                name="type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Issue type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="TASK">Task</SelectItem>
                                                                <SelectItem value="STORY">Story</SelectItem>
                                                                <SelectItem value="BUG">Bug</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                             <FormField
                                                control={form.control}
                                                name="priority"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Priority" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="NONE">None</SelectItem>
                                                                <SelectItem value="LOW">Low</SelectItem>
                                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                                <SelectItem value="HIGH">High</SelectItem>
                                                                <SelectItem value="CRITICAL">Critical</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                            <Button type="submit" size="sm" disabled={isPending}>
                                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    )}
                </div>
            </Card>
            {!isCreating && (
                <Button variant="ghost" onClick={() => setIsCreating(true)} className="text-muted-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create issue
                </Button>
            )}
        </div>
    );
}
