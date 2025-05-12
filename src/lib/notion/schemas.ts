import { z } from "zod";
/**
 [
  {
    "object": "page",
    "id": "1ed0e911-9f97-8077-adb7-da1cac0f5984",
    "created_time": "2025-05-08T18:06:00.000Z",
    "last_edited_time": "2025-05-11T20:00:00.000Z",
    "created_by": {
      "object": "user",
      "id": "794c97a7-e6d4-4225-970d-e6c4cff6a3af"
    },
    "last_edited_by": {
      "object": "user",
      "id": "794c97a7-e6d4-4225-970d-e6c4cff6a3af"
    },
    "cover": null,
    "icon": {
      "type": "custom_emoji",
      "custom_emoji": {
        "id": "1ed0e911-9f97-809c-a82a-007a4dc8c669",
        "name": "jira-epic",
        "url": "https://issues.redhat.com/secure/viewavatar?size=xsmall&avatarId=13267&avatarType=issuetype"
      }
    },
    "parent": {
      "type": "database_id",
      "database_id": "1ed0e911-9f97-8196-8d4a-ef162a63ce3a"
    },
    "archived": false,
    "in_trash": false,
    "properties": {
      "Is current sprint": {
        "id": "%3AcvQ",
        "type": "formula",
        "formula": {
          "type": "boolean",
          "boolean": true
        }
      },
      "Sprint": {
        "id": "B%3BSt",
        "type": "formula",
        "formula": {
          "type": "number",
          "number": 21
        }
      },
      "Sub-item": {
        "id": "CVtJ",
        "type": "relation",
        "relation": [],
        "has_more": false
      },
      "Days remaining": {
        "id": "Qcpn",
        "type": "formula",
        "formula": {
          "type": "string",
          "string": "6 days remaining"
        }
      },
      "Parent item": {
        "id": "Rh%3AY",
        "type": "relation",
        "relation": [],
        "has_more": false
      },
      "Status": {
        "id": "%5BVqh",
        "type": "status",
        "status": {
          "id": "15f8d805-8d6b-4501-a72f-fad69e39b3b6",
          "name": "Backlog",
          "color": "default"
        }
      },
      "Labels": {
        "id": "%5DE%5Cn",
        "type": "multi_select",
        "multi_select": [
          {
            "id": "37f62bff-e4ba-4b7f-8d3e-ca946b936fae",
            "name": "EPIC",
            "color": "purple"
          }
        ]
      },
      "Jira URL": {
        "id": "%60NDc",
        "type": "formula",
        "formula": {
          "type": "string",
          "string": "RHOAISTRAT-553"
        }
      },
      "Due date": {
        "id": "%60TqM",
        "type": "date",
        "date": {
          "start": "2025-05-17",
          "end": null,
          "time_zone": null
        }
      },
      "Jira key": {
        "id": "iPiN",
        "type": "rich_text",
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "RHOAISTRAT-553",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "RHOAISTRAT-553",
            "href": null
          }
        ]
      },
      "Priority": {
        "id": "ouRF",
        "type": "select",
        "select": {
          "id": "jso}",
          "name": "High",
          "color": "red"
        }
      },
      "Name": {
        "id": "title",
        "type": "title",
        "title": [
          {
            "type": "text",
            "text": {
              "content": "Hardware profiles GA",
              "link": null
            },
            "annotations": {
              "bold": false,
              "italic": false,
              "strikethrough": false,
              "underline": false,
              "code": false,
              "color": "default"
            },
            "plain_text": "Hardware profiles GA",
            "href": null
          }
        ]
      },
      "GitHub Pull Requests": {
        "id": "notion%3A%2F%2Ffeature%2Fconnection_property_b759b994-5c32-4268-bbb0-41f435abb8d9",
        "type": "relation",
        "relation": [
          {
            "id": "1f00e911-9f97-8018-9302-c904de058d4f"
          }
        ],
        "has_more": false
      }
    },
    "url": "https://www.notion.so/Hardware-profiles-GA-1ed0e9119f978077adb7da1cac0f5984",
    "public_url": null
  }
]
 */

export enum NotionCustomEmoji {
  JiraEpic = "1ed0e911-9f97-809c-a82a-007a4dc8c669",
  JiraStory = "1f00e911-9f97-804a-abb6-007ab7273916",
  JiraTask = "1f00e911-9f97-801d-be42-007a6547d7af",
  JiraBug = "1f00e911-9f97-807e-bcc3-007a732431e8",
  JiraSubtask = "1f00e911-9f97-80b2-bc89-007a338f0335",
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