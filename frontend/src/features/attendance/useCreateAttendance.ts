import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAttendance, type AttendanceInput } from './attendanceApi'
import { attendanceKeys } from './attendanceKeys'

export function useCreateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AttendanceInput) => createAttendance(input),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all })
    },
  })
}
