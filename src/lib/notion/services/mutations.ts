'use server'

import { getNotionClient } from "../client";
import { mapCreateDtoToNotionApiRequest } from "../mappers";
import { CreateNotionPageDto } from "../schemas";
import { getNotionConfig } from "@/lib/profile/services/queries";

/**
 * Create a new page in the Notion database
 */
export async function createNotionPage(pageData: CreateNotionPageDto): Promise<boolean> {
  try {
    const config = await getNotionConfig();

    if (!config) {
      throw new Error("Could not get Notion config");
    }

    if (!config.token) {
      throw new Error("No Notion API token found for user");
    }

    if (!config.databaseId) {
      throw new Error("No Notion database ID found for user");
    }

    const notionClient = await getNotionClient(config.token);
    
    if (!notionClient) {
      throw new Error("Could not initialize Notion client");
    }

    // Map our DTO to Notion API format
    const requestData = mapCreateDtoToNotionApiRequest(pageData, config.databaseId);
    
    // Create the page in Notion
     await notionClient.pages.create(requestData);
    
     return true
   
  } catch (error) {
    console.error("Error creating Notion page:", error);
    return false;
  }
}

/**
 * Updates the 'Due date' property of a specific Notion page.
 *
 * @param pageId - The ID of the Notion page to update.
 * @param dueDate - The new due date string in "YYYY-MM-DD" format.
 * @param token - The Notion integration token.
 */
export const updateNotionPageDueDate = async (
  pageId: string,
  dueDate: string, // Expecting "YYYY-MM-DD" format
): Promise<void> => {
  const config = await getNotionConfig();

  if (!config) {
    throw new Error("Could not get Notion config");
  }

  if (!config.token) {
    throw new Error("No Notion API token found for user");
  }

  if (!config.databaseId) {
    throw new Error("No Notion database ID found for user");
  }

  const notion = await getNotionClient(config.token);
  if (!notion) {
    throw new Error("Failed to initialize Notion client.");
  }

  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        "Due date": {
          date: {
            start: dueDate, 
          },
        },
      },
    });
    console.log(`Successfully updated due date for Notion page ${pageId}`);
  } catch (error: unknown) {
    console.error(`Error updating due date for Notion page ${pageId}:`, error);
    if (error instanceof Error) {
      throw new Error(
        `Failed to update Notion page due date for ${pageId}: ${error.message}`
      );
    } else {
      throw new Error(
        `An unknown error occurred while updating due date for Notion page ${pageId}`
      );
    }
  }
};
