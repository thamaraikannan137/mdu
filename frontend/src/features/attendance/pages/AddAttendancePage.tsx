import { Typography } from 'antd'
import { AppShell } from '@/components/layout/AppShell'
import { AttendanceForm } from '@/features/attendance/components/AttendanceForm'

export function AddAttendancePage() {
  return (
    <AppShell>
      <Typography.Title level={3}>Add attendance</Typography.Title>
      <AttendanceForm />
    </AppShell>
  )
}
