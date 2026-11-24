import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ListParams } from '@/utils/listQuery'
import {
  getEmployee,
  listEmployees,
  updateEmployee,
  type EmployeeInput,
} from './employeeApi'
import { employeeKeys } from './employeeKeys'

export function useEmployees(params: ListParams) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => listEmployees(params),
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => getEmployee(id),
    enabled: id.length > 0,
  })
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EmployeeInput) => updateEmployee(id, input),
    onSuccess(employee) {
      queryClient.setQueryData(employeeKeys.detail(id), employee)
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
