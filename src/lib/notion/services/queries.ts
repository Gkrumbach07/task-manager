'use server'

import { PageObjectResponse } from "@notionhq/client";
import { getNotionClient } from "../client";
import { mapNotionApiResponseToNotionPage } from "../mappers";
import { NotionPage } from "../schemas";
import { getNotionConfig } from "@/lib/profile/services/queries";

/**
 * Get Notion pages by Jira keys
 */
export async function getNotionPages(): Promise<NotionPage[]> {
  try {
    const config = await getNotionConfig();
    if (!config) {
      throw new Error("Could not get Notion config");
    }
    if(!config.token) {
      throw new Error("No Notion API token found for user");
    }
    if(!config.databaseId) {
      throw new Error("No Notion database ID found for user");
    }

    const notionClient = await getNotionClient(config.token);
    
    if (!notionClient) {
      throw new Error("Could not initialize Notion client");
    }
    
    // Query Notion database for pages with the matching Jira keys
    const response = await notionClient.databases.query({
      database_id: config.databaseId,
    });

    return response.results.map((r) => mapNotionApiResponseToNotionPage(r as PageObjectResponse));
  } catch (error) {
    console.error("Error querying Notion pages by Jira keys:", error);
    return [];
  }
} 