import { Alert, Button, Form, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { Credentials } from '@/features/auth/authApi'
import { useLogin } from '@/features/auth/useLogin'

export function LoginForm() {
  const navigate = useNavigate()
  const loginMutation = useLogin()

  function handleFinish(values: Credentials) {
    loginMutation.mutate(values, {
      onSuccess() {
        navigate('/dashboard', { replace: true })
      },
    })
  }

  return (
    <Form<Credentials>
      layout="vertical"
      className="mx-auto flex w-full max-w-sm flex-col gap-2"
      onFinish={handleFinish}
      disabled={loginMutation.isPending}
    >
      {loginMutation.isError ? (
        <Alert type="error" title={loginMutation.error.message} showIcon />
      ) : null}
      <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
        <Input autoComplete="email" />
      </Form.Item>
      <Form.Item label="Password" name="password" rules={[{ required: true }]}>
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loginMutation.isPending} block>
        Sign in
      </Button>
    </Form>
  )
}
