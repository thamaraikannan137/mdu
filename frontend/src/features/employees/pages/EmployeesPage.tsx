import { Button, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DataTable } from '@/components/ui/DataTable/DataTable'
import type { Employee } from '@/features/employees/employeeApi'
import { useEmployees } from '@/features/employees/useEmployees'
import { useTableQuery } from '@/hooks/useTableQuery'
import { toListParams } from '@/utils/listQuery'

export function EmployeesPage() {
  const navigate = useNavigate()
  const table = useTableQuery('name')
  const employees = useEmployees(toListParams(table.query, 'name'))

  return (
    <AppShell>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Typography.Title level={3} className="!mb-0">
          Employees
        </Typography.Title>
        <Button type="primary" className="w-full sm:w-auto" onClick={() => navigate('/employees/new')}>
          Add employee
        </Button>
      </div>
      <DataTable<Employee>
        columns={[
          { title: 'Name', dataIndex: 'name', sorter: true },
          { title: 'Email', dataIndex: 'email', sorter: true },
          { title: 'Phone', dataIndex: 'phone', sorter: true },
          { title: 'City', dataIndex: 'city', sorter: true },
          { title: 'Job title', dataIndex: 'job_title', sorter: true },
        ]}
        rows={employees.data?.items ?? []}
        rowKey="id"
        isPending={employees.isFetching}
        errorMessage={employees.isError ? employees.error.message : undefined}
        emptyText="No employees yet"
        total={employees.data?.total ?? 0}
        page={table.query.page}
        pageSize={table.query.pageSize}
        search={table.search}
        sortField={table.query.sortField}
        sortOrder={table.query.sortOrder}
        searchPlaceholder="Search employees"
        onSearch={table.onSearch}
        onChange={table.onChange}
        onRowClick={(employee) => navigate(`/employees/${employee.id}`)}
      />
    </AppShell>
  )
}
