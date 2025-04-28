// src/lib/tasks/schemas.ts
import { z } from "zod";
import { JiraPriority, JiraStatus, JiraType } from "./enums";

// Full Task shape returned to clients
export const jiraDtoSchema = z.object({
  id: z.string(),
  key: z.string(),
  url: z.string(),
  title: z.string(),
  priority: z.nativeEnum(JiraPriority),
  labels: z.array(z.string()),
  created: z.string(),
  updated: z.string(),
  assignee: z.object({
    displayName: z.string(),
    email: z.string(),
  }).nullable(),
  status: z.nativeEnum(JiraStatus),
  type: z.nativeEnum(JiraType),
  description: z.string(),
});
export type JiraDto = z.infer<typeof jiraDtoSchema>;
