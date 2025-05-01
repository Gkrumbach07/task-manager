'use server'

import { prisma } from "@/lib/prisma/server";
import { CreateReadJiraIssueDto, ReadJiraIssueDto } from "../schemas";
import { fromPrisma, toPrismaCreateInput } from "../mappers";
import { getUserStrict } from "@/lib/auth/actions";

export const markJiraIssueAsRead = async (issueKey: string, lastReadUuid: string): Promise<ReadJiraIssueDto | null> => {
	const user = await getUserStrict()
	try {
		const data = await prisma.read_jira_issues.create({
			data: toPrismaCreateInput({ issueKey, lastReadUuid }, user.id),
		});
		return fromPrisma(data);
	} catch (error) {
		console.error("Error hiding Jira issue:", error);
		return null;
	}
};

export const unmarkJiraIssueAsRead = async (issueKey: string): Promise<ReadJiraIssueDto | null> => {
	const user = await getUserStrict()
	try {
		const data = await prisma.read_jira_issues.delete({
			where: { user_id_issue_key: { user_id: user.id, issue_key: issueKey } },
		});
		return fromPrisma(data);
	} catch (error) {
		console.error("Error unmarking Jira issue as read:", error);
		return null;
	}
};


export const markJiraIssuesAsRead = async (issues: CreateReadJiraIssueDto[]): Promise<boolean> => {
	const user = await getUserStrict()
	try {
		const data = await prisma.read_jira_issues.createMany({
			data: issues.map((issue) => toPrismaCreateInput(issue, user.id)),
		});
		return data.count === issues.length;
	} catch (error) {
		console.error("Error marking Jira issues as read:", error);
		return false;
	}
};

export const unmarkJiraIssuesAsRead = async (issueKeys: string[]): Promise<boolean> => {
	const user = await getUserStrict()
	try {
		const data = await prisma.read_jira_issues.deleteMany({
			where: { 
				user_id: user.id, 
				issue_key: {
					in: issueKeys
				} 
			} 
		});
		return data.count === issueKeys.length;
	} catch (error) {
		console.error("Error unmarking Jira issues as read:", error);
		return false;
	}
};
