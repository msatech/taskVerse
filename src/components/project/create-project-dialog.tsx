
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createProjectFormSchema, type CreateProjectFormValues } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Organization } from "@prisma/client";
import { createProject } from "@/lib/actions";

type CreateProjectDialogProps = {
  organization: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({ organization, open, onOpenChange }: CreateProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      name: "",
      key: "",
      type: "KANBAN",
    },
  });
  
  const projectKey = form.watch("key");
  form.watch("name");

  async function onSubmit(data: CreateProjectFormValues) {
    setIsLoading(true);
    try {
      const result = await createProject({
          ...data,
          organizationId: organization.id
      });
      if (result.success && result.project) {
        toast({
          title: "Project Created",
          description: `${result.project.name} has been successfully created.`,
        });
        onOpenChange(false);
        router.push(`/${organization.slug}/${result.project.key}`);
        router.refresh();
      } else {
        throw new Error(result.error || "An unknown error occurred.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Error Creating Project",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>
            A project contains your issues, tasks, and documents.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Marketing Campaign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., MKT" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                  </FormControl>
                  <FormDescription>
                    This is a short, unique identifier for your project. e.g., {organization.slug}/{projectKey || "MKT"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="type"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <RadioGroup 
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                        >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="KANBAN" />
                                </FormControl>
                                <FormLabel className="font-normal">Kanban</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="SCRUM" />
                                </FormControl>
                                <FormLabel className="font-normal">Scrum</FormLabel>
                            </FormItem>
                        </RadioGroup>
                    </FormItem>
                )}
            />

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
