import { z } from "zod";

export const HiddenJiraIssueSchema = z.object({
    issueKey: z.string(),
});

export const CreateHiddenJiraIssueSchema = z.object({
    issueKey: z.string(),
});


export type HiddenJiraIssueDto = z.infer<typeof HiddenJiraIssueSchema>;
export type CreateHiddenJiraIssueDto = z.infer<typeof CreateHiddenJiraIssueSchema>;
