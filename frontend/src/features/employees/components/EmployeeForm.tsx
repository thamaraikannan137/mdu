import { Alert, Button, Form } from 'antd'
import { useNavigate } from 'react-router-dom'
import { EmployeeFields } from '@/features/employees/components/EmployeeFields'
import type { EmployeeInput } from '@/features/employees/employeeApi'
import { useCreateEmployee } from '@/features/employees/useCreateEmployee'

export function EmployeeForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm<EmployeeInput>()
  const createEmployee = useCreateEmployee()

  function handleFinish(values: EmployeeInput) {
    createEmployee.mutate(values, {
      onSuccess() {
        navigate('/employees')
      },
    })
  }

  return (
    <Form<EmployeeInput>
      form={form}
      layout="vertical"
      className="w-full max-w-4xl"
      onFinish={handleFinish}
      disabled={createEmployee.isPending}
    >
      {createEmployee.isError ? (
        <Alert type="error" title={createEmployee.error.message} showIcon />
      ) : null}
      <EmployeeFields />
      <Button type="primary" htmlType="submit" loading={createEmployee.isPending} className="w-full sm:w-auto">
        Add employee
      </Button>
    </Form>
  )
}
