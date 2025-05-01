import { z } from "zod";

// Schema for the core profile data fetched from the database
export const ProfileSchema = z.object({
    id: z.string().uuid(),
	timeConfig: z.object({
		fiscalYearStartDate: z.string().nullable(),
		firstSprintStartDate: z.string().nullable(),
		sprintLengthDays: z.number().positive().int().nullable(),
		currentSprint: z.number().positive().int(),
		currentSprintStartDate: z.string().nullable(),
		currentQuarter: z.number().positive().int(),
	}),
    updatedAt: z.date(), 
	jiraConfig: z.object({
		baseUrl: z.string().nullable(),
		userEmail: z.string().nullable(),
		apiTokenConfigured: z.boolean(),
	}),
    githubApiTokenConfigured: z.boolean(),
});

// Schema for the data submitted via the settings form
export const CreateProfileSchema = z.object({
    fiscalYearStartDate: z.string().nullable().optional(),
    firstSprintStartDate: z.string().nullable().optional(),
    sprintLengthDays: z.number().positive().int().nullable().optional(),
	jiraConfig: z.object({
		baseUrl: z.string(),
		userEmail: z.string(),
		apiToken: z.string(),
	}).optional(),
    githubApiToken: z.string().optional(),
});

export const UpdateProfileSchema = CreateProfileSchema.partial().extend({
    id: z.string().uuid(),
	jiraConfig: z.object({
		baseUrl: z.string().optional().nullable(),
		userEmail: z.string().optional().nullable(),
		apiToken: z.string().optional().nullable(),
	}).optional().nullable(),
    githubApiToken: z.string().optional().nullable(),
});

export const JiraConfigSchema = z.object({
    baseUrl: z.string().nullable(),
    userEmail: z.string().nullable(),
    apiToken: z.string().nullable(),
});

export const GithubApiTokenSchema = z.object({
    token: z.string().nullable(),
});

export type ProfileDto = z.infer<typeof ProfileSchema>;
export type CreateProfileDto = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type JiraConfigDto = z.infer<typeof JiraConfigSchema>;
export type GithubApiTokenDto = z.infer<typeof GithubApiTokenSchema>;
