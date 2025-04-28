import { JiraJqlQueryDto } from "@/lib/jira-jql-queries/schemas";
import { JiraDto } from "@/lib/jira/schemas";

export type QueryStatus = {
  status: "idle" | "loading" | "loaded" | "error";
  error?: string;
  issueCount?: number;
};

export type JiraIssueWithQuery = JiraDto & {
  fromJqlQuery: JiraJqlQueryDto[]
};
