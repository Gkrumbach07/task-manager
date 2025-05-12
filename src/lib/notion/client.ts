import { Client } from "@notionhq/client";

// Initialize the Notion client with the token from the user's profile
export const getNotionClient = async (token: string): Promise<Client | null> => {
  try {
    return new Client({
      auth: token,
    });
  } catch (error) {
    console.error("Error getting Notion client:", error);
    throw error;
  }
}