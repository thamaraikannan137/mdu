import { useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Form, Spin, Typography } from 'antd'
import dayjs from 'dayjs'
import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { statusLabel, type AttendanceInput } from '@/features/attendance/attendanceApi'
import { AttendanceFields, type AttendanceFormValues } from '@/features/attendance/components/AttendanceFields'
import { useAttendance, useUpdateAttendance } from '@/features/attendance/useAttendance'
import { useEmployees } from '@/features/employees/useEmployees'
import { toListParams } from '@/utils/listQuery'

export function AttendanceRecordPage() {
  const { attendanceId = '' } = useParams()
  const attendance = useAttendance(attendanceId)
  const updateAttendance = useUpdateAttendance(attendanceId)
  const employees = useEmployees(
    toListParams({ search: '', page: 1, pageSize: 100, sortField: 'name', sortOrder: 'ascend' }, 'name'),
  )
  const [form] = Form.useForm<AttendanceFormValues>()
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!attendance.data) return
    form.setFieldsValue({
      employee_id: attendance.data.employee_id,
      work_date: dayjs(attendance.data.work_date),
      status: attendance.data.status,
    })
  }, [attendance.data, form])

  function startEdit() {
    if (!attendance.data) return
    form.setFieldsValue({
      employee_id: attendance.data.employee_id,
      work_date: dayjs(attendance.data.work_date),
      status: attendance.data.status,
    })
    updateAttendance.reset()
    setEditing(true)
  }

  function cancelEdit() {
    if (!attendance.data) return
    form.setFieldsValue({
      employee_id: attendance.data.employee_id,
      work_date: dayjs(attendance.data.work_date),
      status: attendance.data.status,
    })
    setEditing(false)
  }

  function handleFinish(values: AttendanceFormValues) {
    if (!editing) return
    const input: AttendanceInput = {
      employee_id: values.employee_id,
      work_date: values.work_date.format('YYYY-MM-DD'),
      status: values.status,
    }
    updateAttendance.mutate(input, {
      onSuccess() {
        setEditing(false)
      },
    })
  }

  return (
    <AppShell>
      {attendance.isPending ? <Spin /> : null}
      {attendance.isError ? <Alert type="error" title={attendance.error.message} showIcon /> : null}
      {attendance.isSuccess ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={3} className="!mb-0">
              {attendance.data.employee_name}
            </Typography.Title>
            <Typography.Text type="secondary">
              {dayjs(attendance.data.work_date).format('D MMM YYYY')}
            </Typography.Text>
          </div>
          {editing ? null : (
            <Button type="primary" className="w-full sm:w-auto" onClick={startEdit}>
              Edit
            </Button>
          )}
        </div>
      ) : null}
      {attendance.isSuccess && !editing ? (
        <Card className="w-full">
          <Descriptions column={{ xs: 1, sm: 1, md: 3 }}>
            <Descriptions.Item label="Employee">{attendance.data.employee_name}</Descriptions.Item>
            <Descriptions.Item label="Date">
              {dayjs(attendance.data.work_date).format('D MMM YYYY')}
            </Descriptions.Item>
                <Descriptions.Item label="Status">{statusLabel(attendance.data.status)}</Descriptions.Item>
                <Descriptions.Item label="Times" span={{ xs: 1, sm: 1, md: 3 }}>
                  {attendance.data.spans.length === 0 ? (
                    'None'
                  ) : (
                    <div className="flex flex-col gap-1">
                      {attendance.data.spans.map((span) => (
                        <span key={`${span.in_time}-${span.out_time ?? ''}`}>
                          {span.in_time.slice(0, 5)} – {span.out_time ? span.out_time.slice(0, 5) : '—'}
                        </span>
                      ))}
                    </div>
                  )}
                </Descriptions.Item>
              </Descriptions>
        </Card>
      ) : null}
      <Card className={attendance.isSuccess && editing ? 'w-full' : 'hidden'}>
        <Form<AttendanceFormValues>
          form={form}
          layout="vertical"
          className="w-full"
          onFinish={handleFinish}
          disabled={updateAttendance.isPending}
        >
          {employees.isError ? <Alert type="error" title={employees.error.message} showIcon /> : null}
          {updateAttendance.isError ? (
            <Alert type="error" title={updateAttendance.error.message} showIcon />
          ) : null}
          <AttendanceFields employees={employees.data?.items ?? []} employeesLoading={employees.isPending} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="primary" htmlType="submit" loading={updateAttendance.isPending} className="w-full sm:w-auto">
              Save
            </Button>
            <Button className="w-full sm:w-auto" onClick={cancelEdit} disabled={updateAttendance.isPending}>
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </AppShell>
  )
}
