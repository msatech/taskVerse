
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
            <div className='p-4 rounded-lg bg-card border'>
                {issues.length > 0 ? (
                    <div className="space-y-2">
                        {issues.map(issue => (
                            <BoardCard key={issue.id} issue={issue} onDragStart={() => {}} onClick={() => {}} />
                        ))}
                    </div>
                ) : (
                    !isCreating && <p className="text-muted-foreground text-center p-8">Your backlog is empty.</p>
                )}

                 {isCreating && (
                    <div className="p-2">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                               <div className='flex-1 grid grid-cols-3 gap-2'>
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem className='col-span-2'>
                                            <FormControl>
                                                <Input placeholder="What needs to be done?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                               </div>
                                <Button type="submit" size="sm" disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                            </form>
                        </Form>
                    </div>
                )}
            </div>
            {!isCreating && (
                <Button variant="ghost" onClick={() => setIsCreating(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create issue
                </Button>
            )}
        </div>
    );
}
