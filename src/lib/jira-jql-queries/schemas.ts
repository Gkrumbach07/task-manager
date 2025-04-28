import { z } from "zod";

// Schema for the core JQL query data fetched from the database
export const JiraJqlQuerySchema = z.object({
    id: z.string().uuid(),
    label: z.string(),
    labelColor: z.string().nullable(),
    jql: z.string(),
    enabled: z.boolean(),
    updatedAt: z.date(),
    createdAt: z.date(),
});

// Schema for creating a new JQL query
export const CreateJiraJqlQuerySchema = z.object({
    jql: z.string(),
    label: z.string(),
    labelColor: z.string().optional(),
    enabled: z.boolean().optional(),
});

// Schema for updating an existing JQL query
export const UpdateJiraJqlQuerySchema = CreateJiraJqlQuerySchema.partial().extend({
    id: z.string().uuid(),
});


export type JiraJqlQueryDto = z.infer<typeof JiraJqlQuerySchema>;
export type CreateJiraJqlQueryDto = z.infer<typeof CreateJiraJqlQuerySchema>;
export type UpdateJiraJqlQueryDto = z.infer<typeof UpdateJiraJqlQuerySchema>; 