'use server'

import { Octokit } from "octokit";
import { getGithubApiToken } from '@/lib/profile/services/queries';
import { fromGithubPullRequest } from "../mappers";
import { GithubPullRequestDto } from "../schemas";

export async function getPullRequest(
  owner: string,
  repo: string,
  pullRequestNumber: number,
): Promise<GithubPullRequestDto> {
  const githubApiToken = await getGithubApiToken();

  const token = githubApiToken?.token;

  if (!token) {
    throw new Error(
      'Github is not configured. Please configure Github in the settings.',
    );
  }

  try {
    const octokit = new Octokit({ auth: token });

    const response = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullRequestNumber,
    });


    if (response.status !== 200) {
      throw new Error(
        `GitHub API request failed with status ${response.status}`,
      );
    }

    return fromGithubPullRequest(response);
  } catch (error) {
    console.error('Error fetching Github pull request:', error);
    throw error;
  }
}

