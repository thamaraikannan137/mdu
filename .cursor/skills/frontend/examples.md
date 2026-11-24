# Frontend examples

## App entry

`src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StyleProvider } from '@ant-design/cssinjs'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/app/queryClient'
import { store } from '@/app/store'
import { theme } from '@/app/theme'
import { App } from './App'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root is missing')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <StyleProvider layer>
          <ConfigProvider theme={theme}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ConfigProvider>
        </StyleProvider>
      </Provider>
    </QueryClientProvider>
  </StrictMode>,
)
```

`src/App.tsx`

```tsx
import { AppRoutes } from '@/routes/AppRoutes'

export function App() {
  return <AppRoutes />
}
```

## Tailwind and theme

`src/index.css`

```css
@layer theme, base, antd, components, utilities;

@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
```

`src/app/theme.ts`

```ts
import type { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
  },
}
```

Change product color in `theme.ts`. Do not override `.ant-*` in CSS.

## API client

`src/services/api.ts`

```ts
import { getAccessToken } from '@/services/token'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const detail = body.detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) {
        const first: unknown = detail[0]
        if (typeof first === 'object' && first !== null && 'msg' in first && typeof first.msg === 'string') {
          return first.msg
        }
      }
    }
  } catch {
    // The body was not JSON.
  }
  return response.statusText || 'Request failed'
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(await errorMessage(response), response.status)
  }

  return response.json() as Promise<T>
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}
```

`src/services/token.ts`

```ts
const storageKey = 'access_token'

export function getAccessToken(): string | null {
  return sessionStorage.getItem(storageKey)
}

export function setAccessToken(token: string | null): void {
  if (token === null) {
    sessionStorage.removeItem(storageKey)
    return
  }
  sessionStorage.setItem(storageKey, token)
}
```

`.env.example`

```
VITE_API_URL=http://localhost:8000
```

## Query client

`src/app/queryClient.ts`

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

## Store hooks

`src/app/store.ts`

```ts
import { configureStore } from '@reduxjs/toolkit'

export const store = configureStore({
  reducer: {},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

Register a slice in `reducer` only for shared client state. Server data stays in the query cache.

`src/app/hooks.ts`

```ts
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './store'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
```

## Feature query

`src/features/auth/authKeys.ts`

```ts
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}
```

`src/features/auth/authApi.ts`

```ts
import { api } from '@/services/api'

export interface User {
  id: string
  email: string
}

export interface Credentials {
  email: string
  password: string
}

export interface LoginResult {
  access_token: string
  token_type: 'bearer'
  user: User
}

export function login(credentials: Credentials): Promise<LoginResult> {
  return api.post<LoginResult>('/auth/login', credentials)
}
```

`src/features/auth/useLogin.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setAccessToken } from '@/services/token'
import { authKeys } from './authKeys'
import { login, type Credentials, type LoginResult } from './authApi'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: Credentials) => login(credentials),
    onSuccess(result: LoginResult) {
      setAccessToken(result.access_token)
      queryClient.setQueryData(authKeys.user(), result.user)
    },
  })
}
```

## Feature component

`src/features/auth/components/LoginForm.tsx`

```tsx
import { Alert, Button, Form, Input } from 'antd'
import type { Credentials } from '@/features/auth/authApi'
import { useLogin } from '@/features/auth/useLogin'

export function LoginForm() {
  const loginMutation = useLogin()

  function handleFinish(values: Credentials) {
    loginMutation.mutate(values)
  }

  return (
    <Form<Credentials>
      layout="vertical"
      className="mx-auto flex w-full max-w-sm flex-col gap-2"
      onFinish={handleFinish}
      disabled={loginMutation.isPending}
    >
      {loginMutation.isError ? (
        <Alert type="error" message={loginMutation.error.message} showIcon />
      ) : null}
      <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Password" name="password" rules={[{ required: true }]}>
        <Input.Password />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loginMutation.isPending} block>
        Sign in
      </Button>
    </Form>
  )
}
```

Ant Design `Form` owns the draft fields. Tailwind only sets the form's width and spacing. React Query owns the request and the cached user.
