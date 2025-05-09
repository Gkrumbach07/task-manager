'use server'

import { getUserStrict } from '@/lib/auth/actions'

import { getCachedTaskById, getCachedTasks, getCachedTasksBySources, getCachedTasksByStatus } from './cached'
import { TaskStatus } from '../enums'
import { searchRawTasks } from './queries'

export async function getTasks() {
	const { id } = await getUserStrict()
	return getCachedTasks(id)
}

export async function getTasksBySources(sources: string[]){
	const { id } = await getUserStrict()
	return getCachedTasksBySources(sources, id)
}

export async function getTasksByStatus(status: TaskStatus | TaskStatus[]) {
	const { id } = await getUserStrict()
	return getCachedTasksByStatus(status, id)
}

export async function getTaskById(id: string){
	const { id: userId } = await getUserStrict()
	return getCachedTaskById(id, userId)
}

export async function searchTasks(query: string, limit = 5) {
  const { id } = await getUserStrict()
  return searchRawTasks(query, id, limit)
}
