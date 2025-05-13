import { z } from "zod";

export enum NotionCustomEmoji {
  JiraEpic = "1ed0e911-9f97-809c-a82a-007a4dc8c669",
  JiraStory = "1f00e911-9f97-804a-abb6-007ab7273916",
  JiraTask = "1f00e911-9f97-801d-be42-007a6547d7af",
  JiraBug = "1f00e911-9f97-807e-bcc3-007a732431e8",
  JiraSubtask = "1f00e911-9f97-80b2-bc89-007a338f0335",
  JiraFeature = "1f20e911-9f97-804b-9d3a-007a7e4fd2d8",
}

export const NotionDatabaseTaskPropertiesSchema = z.object({
  'Status': z.object({
    id: z.string(),
    type: z.enum(['status']),
    status: z.object({
      id: z.string(),
      name: z.string(),
      color: z.string()
    }).nullable()
  }),
  'Labels': z.object({
    id: z.string(),
    type: z.enum(['multi_select']),
    multi_select: z.array(z.object({
      id: z.string(),
      name: z.string(),
      color: z.string()
    }))
  }),
  'Due date': z.object({
    id: z.string(),
    type: z.enum(['date']),
    date: z.object({
      start: z.string(),
      end: z.string().nullable(),
      time_zone: z.string().nullable()
    }).nullable()
  }),
  'Jira key': z.object({
    id: z.string(),
    type: z.enum(['rich_text']),
    rich_text: z.array(z.object({
      type: z.enum(['text']),
      text: z.object({
        content: z.string(),
        link: z.string().nullable()
      }),
      annotations: z.object({
        bold: z.boolean(),
        italic: z.boolean(),
        strikethrough: z.boolean(),
        underline: z.boolean(),
        code: z.boolean(),
        color: z.string()
      }),
      plain_text: z.string(),
      href: z.string().nullable()
    }))
  }),
  'Priority': z.object({
    id: z.string(),
    type: z.enum(['select']),
    select: z.object({
      id: z.string(),
      name: z.string(),
      color: z.string()
    }).nullable()
  }),
  'Name': z.object({
    id: z.string(),
    type: z.enum(['title']),
    title: z.array(z.object({
      type: z.enum(['text']),
      text: z.object({
        content: z.string(),
        link: z.string().nullable()
      }),
      annotations: z.object({
        bold: z.boolean(),
        italic: z.boolean(),
        strikethrough: z.boolean(),
        underline: z.boolean(),
        code: z.boolean(),
        color: z.string()
      }),
      plain_text: z.string(),
      href: z.string().nullable()
    }))
  })
})



// Schema for creating a notion page
export const CreateNotionPageDtoSchema = z.object({
  title: z.string(),
  sourceJiraKey: z.string(),
  type: z.nativeEnum(NotionCustomEmoji),
});

// Schema for a notion page (internal representation)
export const NotionPageSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  status: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  priority: z.string().nullable().optional(),
  jiraIssueKey: z.string().nullable().optional(),
});

// Export types derived from the schemas
export type CreateNotionPageDto = z.infer<typeof CreateNotionPageDtoSchema>;
export type NotionPage = z.infer<typeof NotionPageSchema>;
export type NotionDatabaseTaskProperties = z.infer<typeof NotionDatabaseTaskPropertiesSchema>;