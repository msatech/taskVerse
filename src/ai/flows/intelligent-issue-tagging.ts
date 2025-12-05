'use server';

/**
 * @fileOverview A flow that suggests relevant tags for a new issue based on its description.
 * 
 * - suggestIssueTags - A function that handles the tag suggestion process.
 * - SuggestIssueTagsInput - The input type for the suggestIssueTags function.
 * - SuggestIssueTagsOutput - The return type for the suggestIssueTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestIssueTagsInputSchema = z.object({
  description: z.string().describe('The description of the issue.'),
});
export type SuggestIssueTagsInput = z.infer<typeof SuggestIssueTagsInputSchema>;

const SuggestIssueTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of suggested tags for the issue.'),
});
export type SuggestIssueTagsOutput = z.infer<typeof SuggestIssueTagsOutputSchema>;

export async function suggestIssueTags(input: SuggestIssueTagsInput): Promise<SuggestIssueTagsOutput> {
  return suggestIssueTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestIssueTagsPrompt',
  input: {schema: SuggestIssueTagsInputSchema},
  output: {schema: SuggestIssueTagsOutputSchema},
  prompt: `You are a project management assistant that suggests tags for issues based on their description.\n
  Given the following issue description, suggest a list of relevant tags. Only include tags that are highly relevant and specific to the issue.\n
  Description: {{{description}}}\n
  The tags should be relevant to the issue and help categorize it effectively. Return only the list of tags, separated by commas.\n  Example: bug, performance, ui, feature
  Do not return any other information.`,
});

const suggestIssueTagsFlow = ai.defineFlow(
  {
    name: 'suggestIssueTagsFlow',
    inputSchema: SuggestIssueTagsInputSchema,
    outputSchema: SuggestIssueTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
