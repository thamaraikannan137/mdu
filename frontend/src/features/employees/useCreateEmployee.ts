import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEmployee, type EmployeeInput } from './employeeApi'
import { employeeKeys } from './employeeKeys'

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EmployeeInput) => createEmployee(input),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
    },
  })
}
