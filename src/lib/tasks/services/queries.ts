'use server'

import { prisma } from "@/lib/prisma/server";
import { TaskDto } from '../schemas'
import { TaskStatus } from '../enums'
import { fromPrisma } from '../mappers'

export const getRawTasks = async (userId: string): Promise<TaskDto[]> => {
  const rows = await prisma.tasks.findMany({
    where: { user_id: userId },
  })
  return rows.map(fromPrisma)
}

export const getRawTasksBySources = async (
  sources: string[],
  userId: string
): Promise<TaskDto[]> => {
  const rows = await prisma.tasks.findMany({
    where: { source: { in: sources }, user_id: userId },
  })

  return rows.map(fromPrisma)
}

export const getRawTasksByStatus = async (
  status: TaskStatus | TaskStatus[],
  userId: string
): Promise<TaskDto[]> => {
  const statusArray = Array.isArray(status) ? status : [status]

  const rows = await prisma.tasks.findMany({
    where: { status: { in: statusArray }, user_id: userId },
  })

  return rows.map(fromPrisma)
}

export const getRawTaskById = async (id: string, userId: string): Promise<TaskDto> => {
  const row = await prisma.tasks.findUnique({ where: { id, user_id: userId } })

  if (!row) {
    throw new Error('Task not found')
  }

  return fromPrisma(row)
}
