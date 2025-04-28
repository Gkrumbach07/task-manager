"use server"

import { fromPrisma } from "../mappers";
import { type JiraJqlQueryDto } from "../schemas";
import { prisma } from "@/lib/prisma/server";
import { getUserStrict } from "@/lib/auth/actions";

export async function getJqlQueries(): Promise<JiraJqlQueryDto[]> {
    const user = await getUserStrict();
    const queries = await prisma.jira_jql_queries.findMany({
        where: {
            user_id: user.id,
        }
    });

    return queries.map(fromPrisma);
} 

export async function getJqlQueryIds(): Promise<string[]> {
    const user = await getUserStrict();
    const queries = await prisma.jira_jql_queries.findMany({
        where: {
            user_id: user.id,
        },
        select: {
            id: true,
        }
    });

    return queries.map((query) => query.id);
}

export async function getJqlQueryById(id: string): Promise<JiraJqlQueryDto> {
    const user = await getUserStrict();

    const query = await prisma.jira_jql_queries.findUnique({
        where: {
            id,
            user_id: user.id,
        }
    });

    if (!query) {
        throw new Error("Query not found");
    }

    return fromPrisma(query);
}