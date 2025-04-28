import { z } from "zod";

export const HiddenJiraIssueSchema = z.object({
    issueKey: z.string(),
    id: z.string(),
});

export const CreateHiddenJiraIssueSchema = z.object({
    issueKey: z.string(),
});

export const UpdateHiddenJiraIssueSchema = CreateHiddenJiraIssueSchema.partial().extend({
    id: z.string().uuid(),
});

export type HiddenJiraIssueDto = z.infer<typeof HiddenJiraIssueSchema>;
export type CreateHiddenJiraIssueDto = z.infer<typeof CreateHiddenJiraIssueSchema>;
export type UpdateHiddenJiraIssueDto = z.infer<typeof UpdateHiddenJiraIssueSchema>;
