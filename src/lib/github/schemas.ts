// src/lib/tasks/schemas.ts
import { z } from "zod";

// Full Task shape returned to clients
export const githubPullRequestDtoSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  url: z.string(),
  state: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    name: z.string(),
    avatarUrl: z.string(),
  }),
  additions: z.number(),
  deletions: z.number(),
  comments: z.number(),
  reviewComments: z.number(),
});
export type GithubPullRequestDto = z.infer<typeof githubPullRequestDtoSchema>;
