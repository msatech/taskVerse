"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suggestIssueTags } from '@/ai/flows/intelligent-issue-tagging';

import { issueTaggingSchema } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';

type IssueTaggingFormValues = z.infer<typeof issueTaggingSchema>;

export function IssueTaggingForm() {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<IssueTaggingFormValues>({
    resolver: zodResolver(issueTaggingSchema),
    defaultValues: {
      description: '',
    },
  });

  async function onSubmit(data: IssueTaggingFormValues) {
    setIsLoading(true);
    setSuggestedTags([]);
    try {
      const result = await suggestIssueTags(data);
      if (result && result.tags) {
        setSuggestedTags(result.tags);
      } else {
        throw new Error('No tags were suggested.');
      }
    } catch (error) {
      console.error('Error suggesting tags:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to suggest tags. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., The login button on the checkout page is not working on Safari. It seems to be a CSS issue related to flexbox."
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Suggest Tags
          </Button>
        </form>
      </Form>

      {suggestedTags.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Suggested Tags:</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
