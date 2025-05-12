"use server"

import { getUserStrict } from "@/lib/auth/actions";
import { fromPrisma, fromPrismaGithubApiToken, fromPrismaJiraConfig, fromPrismaNotionConfig } from "../mappers";
import type { GithubApiTokenDto, JiraConfigDto, NotionConfigDto, ProfileDto } from "../schemas";
import { prisma } from "@/lib/prisma/server";


export async function getRawProfile(userId: string): Promise<ProfileDto | null> {
    const row = await prisma.profiles.findUnique({ where: { user_id: userId } })
  
    return row ? fromPrisma(row) : null
}

export const getJiraConfig = async (): Promise<JiraConfigDto | null> => {
    const user = await getUserStrict()
    const row = await prisma.profiles.findUnique({ where: { user_id: user.id } })
  
    return row ? fromPrismaJiraConfig(row) : null
};

export const getGithubApiToken = async (): Promise<GithubApiTokenDto | null> => {
    const user = await getUserStrict()
    const row = await prisma.profiles.findUnique({ where: { user_id: user.id } })
  
    return row ? fromPrismaGithubApiToken(row) : null
};

export const getNotionConfig = async (): Promise<NotionConfigDto | null> => {
    const user = await getUserStrict()
    const row = await prisma.profiles.findUnique({ where: { user_id: user.id } })
  
    return row ? fromPrismaNotionConfig(row) : null
};