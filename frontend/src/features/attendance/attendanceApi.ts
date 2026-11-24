import { api } from '@/services/api'
import { toQueryString, type ListParams } from '@/utils/listQuery'

export const attendanceStatuses = ['present', 'half_day', 'absent', 'leave'] as const

export type AttendanceStatus = (typeof attendanceStatuses)[number]

export interface AttendanceSpan {
  in_time: string
  out_time: string | null
}

export interface Attendance {
  id: string
  employee_id: string
  employee_name: string
  work_date: string
  status: AttendanceStatus
  spans: AttendanceSpan[]
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface AttendanceInput {
  employee_id: string
  work_date: string
  status: AttendanceStatus
}

export interface AttendanceRosterItem {
  employee_id: string
  employee_name: string
  status: AttendanceStatus | null
  spans: AttendanceSpan[]
}

export interface AttendanceRangeDay {
  work_date: string
  status: AttendanceStatus
  spans: AttendanceSpan[]
}

export interface AttendanceRangeItem {
  employee_id: string
  employee_name: string
  days: AttendanceRangeDay[]
}

export interface AttendanceRange {
  start: string
  end: string
  items: AttendanceRangeItem[]
}

export interface AttendanceRoster {
  work_date: string
  items: AttendanceRosterItem[]
}

export interface AttendanceMark {
  employee_id: string
  status: AttendanceStatus
  spans: AttendanceSpan[]
}

export interface AttendancePage {
  items: Attendance[]
  total: number
  limit: number
  offset: number
}

export function statusLabel(status: AttendanceStatus): string {
  if (status === 'present') return 'Present'
  if (status === 'half_day') return 'Half day'
  if (status === 'absent') return 'Absent'
  return 'Leave'
}

export function getAttendanceRange(start: string, end: string): Promise<AttendanceRange> {
  return api.get<AttendanceRange>(`/attendance/range?start=${start}&end=${end}`)
}

export function getAttendanceDay(workDate: string): Promise<AttendanceRoster> {
  return api.get<AttendanceRoster>(`/attendance/day?work_date=${workDate}`)
}

export function saveAttendanceDay(workDate: string, marks: AttendanceMark[]): Promise<AttendanceRoster> {
  return api.post<AttendanceRoster>('/attendance/day', { work_date: workDate, marks })
}

export function listAttendance(params: ListParams): Promise<AttendancePage> {
  return api.get<AttendancePage>(`/attendance?${toQueryString(params)}`)
}

export function getAttendance(id: string): Promise<Attendance> {
  return api.get<Attendance>(`/attendance/${id}`)
}

export function createAttendance(input: AttendanceInput): Promise<Attendance> {
  return api.post<Attendance>('/attendance', input)
}

export function updateAttendance(id: string, input: AttendanceInput): Promise<Attendance> {
  return api.patch<Attendance>(`/attendance/${id}`, input)
}
