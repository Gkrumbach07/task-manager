'use cache'

import { TaskStatus } from '../enums'
import { getRawTasks, getRawTasksBySources, getRawTasksByStatus, getRawTaskById } from "./queries";
import { unstable_cacheTag as cacheTag } from 'next/cache'

export const getCachedTasks = async (userId: string) => {
  const tasks = await getRawTasks(userId)
  cacheTag('tasks')
  return tasks
}

export const getCachedTasksBySources = async (
  sources: string[],
  userId: string
)=> {
  const tasks = await getRawTasksBySources(sources, userId)
  cacheTag('tasks')
  return tasks
}

export const getCachedTasksByStatus = async (
  status: TaskStatus | TaskStatus[],
  userId: string
) => {
  const tasks = await getRawTasksByStatus(status, userId)

  const statusArray = Array.isArray(status) ? status : [status]

  cacheTag('tasks')
  statusArray.forEach(status => {
    cacheTag(`tasks:${status}`)
  })

  return tasks
}

export const getCachedTaskById = async (id: string, userId: string) => {
  const task = await getRawTaskById(id, userId)
  if (task) {
    cacheTag("tasks", `task:${task.id}`)
  }
  return task
}
