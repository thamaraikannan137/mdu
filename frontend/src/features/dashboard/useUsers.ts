import { useQuery } from '@tanstack/react-query'
import type { ListParams } from '@/utils/listQuery'
import { listUsers } from './dashboardApi'
import { dashboardKeys } from './dashboardKeys'

export function useUsers(params: ListParams) {
  return useQuery({
    queryKey: dashboardKeys.users(params),
    queryFn: () => listUsers(params),
  })
}
