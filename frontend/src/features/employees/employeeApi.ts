import { api } from '@/services/api'
import { toQueryString, type ListParams } from '@/utils/listQuery'

export interface Employee {
  id: string
  name: string
  email: string
  job_title: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface EmployeeInput {
  name: string
  email: string
  job_title: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  pincode: string
}

export interface EmployeePage {
  items: Employee[]
  total: number
  limit: number
  offset: number
}

export function listEmployees(params: ListParams): Promise<EmployeePage> {
  return api.get<EmployeePage>(`/employees?${toQueryString(params)}`)
}

export function getEmployee(id: string): Promise<Employee> {
  return api.get<Employee>(`/employees/${id}`)
}

export function createEmployee(input: EmployeeInput): Promise<Employee> {
  return api.post<Employee>('/employees', input)
}

export function updateEmployee(id: string, input: EmployeeInput): Promise<Employee> {
  return api.patch<Employee>(`/employees/${id}`, input)
}
