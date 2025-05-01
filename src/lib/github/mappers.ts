import { GithubPullRequestDto } from "./schemas";
import { Endpoints } from "@octokit/types";

type PullRequestGetResponse = Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"];

export function fromGithubPullRequest(row: PullRequestGetResponse): GithubPullRequestDto {
  return {
    id: row.data.id,
    number: row.data.number,
    title: row.data.title,
    url: row.data.url,
    state: row.data.state,
    createdAt: row.data.created_at,
    updatedAt: row.data.updated_at,
    user: {
      name: row.data.user.login,
      avatarUrl: row.data.user.avatar_url,
    },
    additions: row.data.additions,
    deletions: row.data.deletions,
    comments: row.data.comments,
    reviewComments: row.data.review_comments,

  };
}
