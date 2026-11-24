import { DatePicker, Form, Select } from 'antd'
import type { Dayjs } from 'dayjs'
import { attendanceStatuses, statusLabel, type AttendanceStatus } from '@/features/attendance/attendanceApi'

export type AttendanceFormValues = {
  employee_id: string
  work_date: Dayjs
  status: AttendanceStatus
}

type AttendanceFieldsProps = {
  employees: { id: string; name: string }[]
  employeesLoading: boolean
}

export function AttendanceFields({ employees, employeesLoading }: AttendanceFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6">
      <Form.Item className="!mb-4" label="Employee" name="employee_id" rules={[{ required: true }]}>
        <Select
          showSearch
          optionFilterProp="label"
          loading={employeesLoading}
          options={employees.map((employee) => ({ value: employee.id, label: employee.name }))}
        />
      </Form.Item>
      <Form.Item className="!mb-4" label="Date" name="work_date" rules={[{ required: true }]}>
        <DatePicker className="w-full" />
      </Form.Item>
      <Form.Item className="!mb-4" label="Status" name="status" rules={[{ required: true }]}>
        <Select options={attendanceStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} />
      </Form.Item>
    </div>
  )
}
