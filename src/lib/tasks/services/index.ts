'use server'

import { getUserStrict } from '@/lib/auth/actions'

import { getCachedTaskById, getCachedTasks, getCachedTasksBySources, getCachedTasksByStatus } from './cached'
import { TaskStatus } from '../enums'

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
