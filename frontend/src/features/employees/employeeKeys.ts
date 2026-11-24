import type { ListParams } from '@/utils/listQuery'

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: ListParams) => [...employeeKeys.lists(), params] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
}
