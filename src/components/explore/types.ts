import { JiraJqlQueryDto } from "@/lib/jira-jql-queries/schemas";
import { JiraDto } from "@/lib/jira/schemas";


export type JiraIssueWithQuery = JiraDto & {
  fromJqlQuery: JiraJqlQueryDto[]
};

export type JiraQueryExecution = {
  queryId: string;
  lastExecutedJql: string;
  issues: JiraDto[];
}

export type JiraFieldFilter = {
  field: keyof JiraDto;
  value: unknown;
};