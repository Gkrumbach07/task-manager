import { CreatePageParameters, DatabaseObjectResponse, PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionPage, CreateNotionPageDto, NotionDatabaseTaskPropertiesSchema } from "./schemas";
import type { JiraDto } from "@/lib/jira/schemas";
import { JiraType } from "@/lib/jira/enums";
import { NotionCustomEmoji } from "./schemas";


/**
 * Maps a Notion API page object to our internal NotionPage type
 */
export function mapNotionApiResponseToNotionPage(notionApiPage: PageObjectResponse | DatabaseObjectResponse): NotionPage {
  const propertiesParsed = NotionDatabaseTaskPropertiesSchema.safeParse(notionApiPage.properties);
  if (!propertiesParsed.success) {
    console.error(JSON.stringify(propertiesParsed.error.errors, null, 2));
    throw new Error("Invalid properties");
  }
  const properties = propertiesParsed.data;

  return {
    id: notionApiPage.id,
    url: notionApiPage.url,
    title: properties.Name.title.map((t) => t.plain_text).join(""),
    status: properties.Status?.status?.name,
    dueDate: properties['Due date']?.date?.start,
    type: properties.Type?.select?.name,
    jiraIssueKey: properties['Jira key']?.rich_text?.map((t) => t.plain_text).join(""),
  };
}

/**
 * Maps our CreateNotionPageDto to the format expected by the Notion API
 */
export function mapCreateDtoToNotionApiRequest(
  dto: CreateNotionPageDto, 
  databaseId: string
): CreatePageParameters {
   
  const properties: CreatePageParameters['properties'] = {
    Name: {
      title: [{ text: { content: dto.title } }],
    },
    "Jira key": {
      rich_text: [{ text: { content: dto.sourceJiraKey } }],
    },
    "Status": {
      status: { name: "Backlog"},
    },
  };

  return {
    parent: { database_id: databaseId },
      icon: dto.type ? {
        type: "custom_emoji",
        custom_emoji: {
          id: dto.type,
        },
      } : undefined,
    properties,
  };
}

export const mapJiraIssueTypeToNotionCustomEmoji = (
  issueType: JiraType
): NotionCustomEmoji => {
  switch (issueType) {
    case JiraType.TASK:
      return NotionCustomEmoji.JiraTask;
    case JiraType.SUB_TASK:
      return NotionCustomEmoji.JiraSubtask;
    case JiraType.BUG:
      return NotionCustomEmoji.JiraBug;
    case JiraType.STORY:
      return NotionCustomEmoji.JiraStory;
    case JiraType.EPIC:
      return NotionCustomEmoji.JiraEpic;
    case JiraType.FEATURE: // Assuming FEATURE maps to Epic based on original code
      return NotionCustomEmoji.JiraEpic;
    default:
      // Fallback for unhandled Jira types
      return NotionCustomEmoji.JiraTask; // Default to JiraTask
  }
};

export const jiraToCreateNotionPageDto = (issue: JiraDto): CreateNotionPageDto => ({
  title: issue.title,
  sourceJiraKey: issue.key,
  type: mapJiraIssueTypeToNotionCustomEmoji(issue.type),
}); 