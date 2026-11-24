import type { ListParams } from '@/utils/listQuery'

export const attendanceKeys = {
  all: ['attendance'] as const,
  lists: () => [...attendanceKeys.all, 'list'] as const,
  list: (params: ListParams) => [...attendanceKeys.lists(), params] as const,
  day: (workDate: string) => [...attendanceKeys.all, 'day', workDate] as const,
  ranges: () => [...attendanceKeys.all, 'range'] as const,
  range: (start: string, end: string) => [...attendanceKeys.ranges(), start, end] as const,
  detail: (id: string) => [...attendanceKeys.all, 'detail', id] as const,
}
