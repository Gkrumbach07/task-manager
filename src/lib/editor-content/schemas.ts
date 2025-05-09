import { z } from "zod";

// Prisma JSON type can be any valid JSON, represented here with z.any()
// Adjust if you have a more specific structure for your Tiptap content
export const EditorContentSchema = z.object({
  id: z.string().uuid(),
  date: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date()),
  createdAt: z.date(),
  updatedAt: z.date(),
  content: z.any(), // Represents the JSON content from Tiptap
});

export type EditorContentDto = z.infer<typeof EditorContentSchema>;

// Schema for creating/updating content (adjust as needed)
// Often, id, userId, createdAt, updatedAt are handled by the backend/db
export const UpsertEditorContentSchema = z.object({
    date: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    content: z.any(),
});

export type UpsertEditorContentDto = z.infer<typeof UpsertEditorContentSchema>; 