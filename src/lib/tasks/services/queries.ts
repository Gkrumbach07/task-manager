'use server'

import { prisma } from "@/lib/prisma/server";
import { TaskDto } from '../schemas'
import { TaskStatus } from '../enums'
import { fromPrisma } from '../mappers'
import { getUserStrict } from '@/lib/auth/actions'

export const getTasks = async (): Promise<TaskDto[]> => {
  const user = await getUserStrict()
  const rows = await prisma.tasks.findMany({
    where: { user_id: user.id },
  })
  return rows.map(fromPrisma)
}

export const getTasksBySources = async (
  sources: string[]
): Promise<TaskDto[]> => {
  const user = await getUserStrict()

  const rows = await prisma.tasks.findMany({
    where: { source: { in: sources }, user_id: user.id },
  })

  return rows.map(fromPrisma)
}

export const getTasksByStatus = async (
  status: TaskStatus | TaskStatus[]
): Promise<TaskDto[]> => {
  const user = await getUserStrict()
  const statusArray = Array.isArray(status) ? status : [status]

  const rows = await prisma.tasks.findMany({
    where: { status: { in: statusArray }, user_id: user.id },
  })

  return rows.map(fromPrisma)
}

export const getTaskById = async (id: string): Promise<TaskDto | null> => {
  const user = await getUserStrict()
  const row = await prisma.tasks.findUnique({ where: { id, user_id: user.id } })

  return row ? fromPrisma(row) : null
}
