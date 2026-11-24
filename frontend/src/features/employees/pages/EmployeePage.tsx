import { useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Form, Spin, Typography } from 'antd'
import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { EmployeeFields } from '@/features/employees/components/EmployeeFields'
import type { Employee, EmployeeInput } from '@/features/employees/employeeApi'
import { useEmployee, useUpdateEmployee } from '@/features/employees/useEmployees'

function toInput(employee: Employee): EmployeeInput {
  return {
    name: employee.name,
    email: employee.email,
    job_title: employee.job_title,
    phone: employee.phone,
    address: employee.address,
    city: employee.city,
    state: employee.state,
    country: employee.country,
    pincode: employee.pincode,
  }
}

export function EmployeePage() {
  const { employeeId = '' } = useParams()
  const employee = useEmployee(employeeId)
  const updateEmployee = useUpdateEmployee(employeeId)
  const [form] = Form.useForm<EmployeeInput>()
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!employee.data) return
    form.setFieldsValue(toInput(employee.data))
  }, [employee.data, form])

  function startEdit() {
    if (employee.data) form.setFieldsValue(toInput(employee.data))
    updateEmployee.reset()
    setEditing(true)
  }

  function cancelEdit() {
    if (employee.data) form.setFieldsValue(toInput(employee.data))
    setEditing(false)
  }

  function handleFinish(values: EmployeeInput) {
    if (!editing) return
    updateEmployee.mutate(values, {
      onSuccess() {
        setEditing(false)
      },
    })
  }

  return (
    <AppShell>
      {employee.isPending ? <Spin /> : null}
      {employee.isError ? <Alert type="error" title={employee.error.message} showIcon /> : null}
      {employee.isSuccess ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Typography.Title level={3} className="!mb-0">
              {employee.data.name}
            </Typography.Title>
            {editing ? null : <Typography.Text type="secondary">{employee.data.job_title}</Typography.Text>}
          </div>
          {editing ? null : (
            <Button type="primary" className="w-full sm:w-auto" onClick={startEdit}>
              Edit
            </Button>
          )}
        </div>
      ) : null}
      {employee.isSuccess && !editing ? (
        <Card className="w-full">
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} styles={{ label: { width: 120 } }}>
            <Descriptions.Item label="Email">{employee.data.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{employee.data.phone}</Descriptions.Item>
            <Descriptions.Item label="Address" span={{ xs: 1, sm: 1, md: 2 }}>
              {employee.data.address}
            </Descriptions.Item>
            <Descriptions.Item label="City">{employee.data.city}</Descriptions.Item>
            <Descriptions.Item label="State">{employee.data.state}</Descriptions.Item>
            <Descriptions.Item label="Country">{employee.data.country}</Descriptions.Item>
            <Descriptions.Item label="Pincode">{employee.data.pincode}</Descriptions.Item>
          </Descriptions>
        </Card>
      ) : null}
      <Card className={employee.isSuccess && editing ? 'w-full' : 'hidden'}>
        <Form<EmployeeInput>
          form={form}
          layout="vertical"
          className="w-full"
          onFinish={handleFinish}
          disabled={updateEmployee.isPending}
        >
          {updateEmployee.isError ? (
            <Alert type="error" title={updateEmployee.error.message} showIcon />
          ) : null}
          <EmployeeFields />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="primary" htmlType="submit" loading={updateEmployee.isPending} className="w-full sm:w-auto">
              Save
            </Button>
            <Button className="w-full sm:w-auto" onClick={cancelEdit} disabled={updateEmployee.isPending}>
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </AppShell>
  )
}
