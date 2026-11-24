import { Typography } from 'antd'
import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-sm">
        <Typography.Title level={3} className="text-center">
          Sign in
        </Typography.Title>
        <LoginForm />
      </section>
    </main>
  )
}
