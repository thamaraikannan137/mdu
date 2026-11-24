import type { ListParams } from '@/utils/listQuery'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  users: (params: ListParams) => [...dashboardKeys.all, 'users', params] as const,
}
