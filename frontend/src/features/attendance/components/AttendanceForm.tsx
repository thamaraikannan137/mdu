import { Alert, Button, Form } from 'antd'
import { useNavigate } from 'react-router-dom'
import { AttendanceFields, type AttendanceFormValues } from '@/features/attendance/components/AttendanceFields'
import { useCreateAttendance } from '@/features/attendance/useCreateAttendance'
import { useEmployees } from '@/features/employees/useEmployees'
import { toListParams } from '@/utils/listQuery'

export function AttendanceForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm<AttendanceFormValues>()
  const createAttendance = useCreateAttendance()
  const employees = useEmployees(
    toListParams({ search: '', page: 1, pageSize: 100, sortField: 'name', sortOrder: 'ascend' }, 'name'),
  )

  function handleFinish(values: AttendanceFormValues) {
    createAttendance.mutate(
      {
        employee_id: values.employee_id,
        work_date: values.work_date.format('YYYY-MM-DD'),
        status: values.status,
      },
      {
        onSuccess() {
          navigate('/attendance')
        },
      },
    )
  }

  return (
    <Form<AttendanceFormValues>
      form={form}
      layout="vertical"
      className="w-full"
      onFinish={handleFinish}
      disabled={createAttendance.isPending}
    >
      {employees.isError ? <Alert type="error" title={employees.error.message} showIcon /> : null}
      {createAttendance.isError ? (
        <Alert type="error" title={createAttendance.error.message} showIcon />
      ) : null}
      <AttendanceFields
        employees={employees.data?.items ?? []}
        employeesLoading={employees.isPending}
      />
      <Button type="primary" htmlType="submit" loading={createAttendance.isPending} className="w-full sm:w-auto">
        Add attendance
      </Button>
    </Form>
  )
}
