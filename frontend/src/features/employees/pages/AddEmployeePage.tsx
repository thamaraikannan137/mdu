import { Typography } from 'antd'
import { AppShell } from '@/components/layout/AppShell'
import { EmployeeForm } from '@/features/employees/components/EmployeeForm'

export function AddEmployeePage() {
  return (
    <AppShell>
      <Typography.Title level={3}>Add employee</Typography.Title>
      <EmployeeForm />
    </AppShell>
  )
}
