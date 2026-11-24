import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListParams } from '@/utils/listQuery'
import {
  getAttendance,
  getAttendanceDay,
  getAttendanceRange,
  listAttendance,
  saveAttendanceDay,
  updateAttendance,
  type AttendanceInput,
  type AttendanceMark,
} from './attendanceApi'
import { attendanceKeys } from './attendanceKeys'

export function useAttendanceList(params: ListParams) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: () => listAttendance(params),
  })
}

export function useAttendanceDay(workDate: string) {
  return useQuery({
    queryKey: attendanceKeys.day(workDate),
    queryFn: () => getAttendanceDay(workDate),
  })
}

export function useAttendanceRange(start: string, end: string) {
  return useQuery({
    queryKey: attendanceKeys.range(start, end),
    queryFn: () => getAttendanceRange(start, end),
  })
}

export function useSaveAttendanceDay(workDate: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (marks: AttendanceMark[]) => saveAttendanceDay(workDate, marks),
    onSuccess(roster) {
      queryClient.setQueryData(attendanceKeys.day(workDate), roster)
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.ranges() })
    },
  })
}

export function useAttendance(id: string) {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: () => getAttendance(id),
    enabled: id.length > 0,
  })
}

export function useUpdateAttendance(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AttendanceInput) => updateAttendance(id, input),
    onSuccess(attendance) {
      queryClient.setQueryData(attendanceKeys.detail(id), attendance)
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() })
    },
  })
}
