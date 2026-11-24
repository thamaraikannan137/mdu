import { api } from '@/services/api'
import type { User } from '@/features/auth/authApi'
import { toQueryString, type ListParams } from '@/utils/listQuery'

export interface UserPage {
  items: User[]
  total: number
  limit: number
  offset: number
}

export function listUsers(params: ListParams): Promise<UserPage> {
  return api.get<UserPage>(`/users?${toQueryString(params)}`)
}
