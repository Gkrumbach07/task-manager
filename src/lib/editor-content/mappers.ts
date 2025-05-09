import type { Editor_content } from "@prisma/client";
import type { EditorContentDto } from "./schemas";

/**
 * Maps a Prisma editor_content object to an EditorContentDto.
 * Handles potential null content (though schema defines it as non-null Json).
 * Assumes content is already valid JSON.
 */
export function mapPrismaEditorContentToDto(
  prismaEditorContent: Editor_content
): EditorContentDto {
  return {
    id: prismaEditorContent.id,
    userId: prismaEditorContent.user_id,
    date: new Date(prismaEditorContent.date), // Ensure it's a Date object
    createdAt: prismaEditorContent.created_at,
    updatedAt: prismaEditorContent.updated_at,
    // Prisma's Json type maps to `Prisma.JsonValue` which can be null,
    // number, string, boolean, array, or object.
    // We cast to `Record<string, unknown>` as a common representation for JSON objects.
    // Adjust if your Tiptap content has a more specific known structure.
    content: prismaEditorContent.content as Record<string, unknown>,
  };
} 