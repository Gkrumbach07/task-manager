'use server'

import { prisma } from "@/lib/prisma/server";
import { toPrismaCreateInput, toPrismaUpdateInput, fromPrisma } from "../mappers";
import { 
    type CreateJiraJqlQueryDto,
    type UpdateJiraJqlQueryDto,
    type JiraJqlQueryDto
} from "../schemas";
import { getUserStrict } from "@/lib/auth/actions";

export async function createJqlQuery(dto: CreateJiraJqlQueryDto): Promise<JiraJqlQueryDto | null> {
    const user = await getUserStrict();
    try {
        const data = toPrismaCreateInput(dto, user.id);
        const newQuery = await prisma.jira_jql_queries.create({ data });
        return fromPrisma(newQuery);
    } catch (error) {
        console.error("Error creating JQL query:", error);
        return null;
    }
}

export async function updateJqlQuery(dto: UpdateJiraJqlQueryDto): Promise<JiraJqlQueryDto | null> {
    const user = await getUserStrict();
    try {
        const data = toPrismaUpdateInput(dto);
        const updatedQuery = await prisma.jira_jql_queries.update({
            where: { id: dto.id, user_id: user.id },
            data,
        });
        return fromPrisma(updatedQuery);
    } catch (error) {
        console.error("Error updating JQL query:", error);
        return null;
    }
}

export async function deleteJqlQuery(id: string): Promise<boolean> {
	try {
		const user = await getUserStrict()
		await prisma.jira_jql_queries.delete({ where: { id, user_id: user.id } });
        return true;
	} catch (error) {
		console.error("Error deleting JQL query:", error);
		return false;
	}
} 