'use server'

import { prisma } from "@/lib/prisma/server";
import { HiddenJiraIssueDto } from "../schemas";
import { fromPrisma, toPrismaCreateInput } from "../mappers";
import { getUserStrict } from "@/lib/auth/actions";

export const hideJiraIssue = async (issueKey: string): Promise<HiddenJiraIssueDto | null> => {
	const user = await getUserStrict()
	try {
		const data = await prisma.hidden_jira_issues.create({
			data: toPrismaCreateInput({ issueKey }, user.id),
		});
		return fromPrisma(data);
	} catch (error) {
		console.error("Error hiding Jira issue:", error);
		return null;
	}
};