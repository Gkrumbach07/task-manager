'use server'

import { getJiraConfig } from '@/lib/profile/services/queries';
import { fromJira } from '../mappers';
import { JiraDto } from '../schemas';
import { getReadJiraIssues } from '@/lib/read-jiras-issues/services/queries';
import { unmarkJiraIssuesAsRead } from '@/lib/read-jiras-issues/services/mutations';

export type JiraIssue = {
	id: string;
	key: string;
	self: string; // Use self for URL
	fields: {
	  summary: string;
	  priority: { name: string };
	  labels: string[];
	  created: string;
	  updated: string;
	  assignee?: {
		displayName: string;
		emailAddress: string;
	  };
    customfield_12310220?: string[] // git pull request urls
	  status: { name: string };
	  issuetype: { name: string };
	  description?: string;
	};
};

type JiraSearchResult = {
  expand?: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
};

/**
 * Fetches Jira issues based on a JQL query using the Jira Cloud Platform REST API v2.
 *
 * @param jql The JQL query string.
 * @param startAt The index of the first issue to return (0-based).
 * @param maxResults The maximum number of issues to return per page.
 * @param fields Array of fields to retrieve for each issue. Defaults to '*all'.
 * @returns A Promise resolving to the JiraSearchResult object.
 */
export async function searchIssuesByJql(
  jql: string,
  startAt: number = 0,
  maxResults: number = 50,
  fields: string[] = ['*all'],
): Promise<JiraDto[]> {
  const jiraConfig = await getJiraConfig();

  const baseUrl = jiraConfig?.baseUrl;
  const email = jiraConfig?.userEmail;
  const apiToken = jiraConfig?.apiToken;

  if (!baseUrl || !email || !apiToken) {
    throw new Error(
      'Jira is not configured. Please configure Jira in the settings.',
    );
  }

  const apiPath = '/rest/api/2/search';
  const url = `${baseUrl}${apiPath}`;

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    jql,
    startAt,
    maxResults,
    fields,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Jira API request failed with status ${response.status}: ${errorText}`,
      );
    }

    const data: JiraSearchResult = await response.json();

    return data.issues.map((issue) => fromJira(issue, baseUrl));
  } catch (error) {
    throw error; 
  }
}

export async function searchIssuesByJqlAndUpdateReadJiraIssues(
  jql: string,
  startAt?: number,
  maxResults?: number,
  fields?: string[],
) {
  const issues = await searchIssuesByJql(jql, startAt, maxResults, fields);
  const lastReadIssues = await getReadJiraIssues();
  const lastReadIssuesMap = new Map(lastReadIssues?.map((issue) => [issue.issueKey, issue.lastReadUuid]));
  
  // compare last_read_uuid with issue updated field
  const issuesToUpdate = issues
    .filter((issue) => {
      const lastRead = lastReadIssuesMap.get(issue.key);
      const updated = issue.updated;
      return lastRead !== updated;
    })
    .map((issue) => issue.key);

  await unmarkJiraIssuesAsRead(issuesToUpdate);
  
  return issues;
}
