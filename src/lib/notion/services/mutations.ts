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
