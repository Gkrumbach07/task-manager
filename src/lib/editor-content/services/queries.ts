import prisma from "../../prisma";
import { mapPrismaEditorContentToDto } from "../mappers";
import type { EditorContentDto } from "../schemas";
import { getUserId } from "../../auth/utils"; // Assuming getUserId is in auth/utils.ts

/**
 * Fetches editor content for a specific date for the current user.
 */
export async function getEditorContentByDate(
  date: Date
): Promise<EditorContentDto | null> {
  const userId = await getUserId(); // Or however you get the authenticated user ID
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Prisma needs the date part only if the DB field is Date
  // If it's DateTime/Timestamp, you might need to query a range for the day
  const dateOnly = date.toISOString().split('T')[0];

  const editorContent = await prisma.editor_content.findUnique({
    where: {
      user_id_date: { // Assuming a compound index/unique constraint
        user_id: userId,
        date: new Date(dateOnly), // Use the date object
      },
    },
  });

  if (!editorContent) {
    return null;
  }

  return mapPrismaEditorContentToDto(editorContent);
} 