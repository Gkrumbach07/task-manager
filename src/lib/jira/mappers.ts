// src/lib/tasks/mappers.ts
import { JiraPriority, JiraStatus, JiraType } from "./enums";
import {
  JiraDto,
} from "./schemas";
import { JiraIssue } from "./services";

const getJiraUrl = (baseUrl: string, issueKey: string) => {
  // clean baseUrl: remove protocol and trailing slash
  const cleanBaseUrl = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${cleanBaseUrl}/browse/${issueKey}`;
}

export function fromJira(row: JiraIssue, baseUrl: string): JiraDto {
  return {
    id: row.id,
    key: row.key,
    url: getJiraUrl(baseUrl, row.key),
    title: row.fields.summary,
    priority: row.fields.priority.name as JiraPriority,
    labels: row.fields.labels,
    created: row.fields.created,
    updated: row.fields.updated,
    assignee: row.fields.assignee ? {
      displayName: row.fields.assignee.displayName,
      email: row.fields.assignee.emailAddress,
    } : null,
    status: row.fields.status.name as JiraStatus,
    type: row.fields.issuetype.name as JiraType,
    description: row.fields.description ?? "",
  };
}
