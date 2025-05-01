import { z } from "zod";

export const ReadJiraIssueSchema = z.object({
    issueKey: z.string(),
    lastReadUuid: z.string(),
});

export const CreateReadJiraIssueSchema = z.object({
    issueKey: z.string(),
    lastReadUuid: z.string(),
});


export type ReadJiraIssueDto = z.infer<typeof ReadJiraIssueSchema>;
export type CreateReadJiraIssueDto = z.infer<typeof CreateReadJiraIssueSchema>;
