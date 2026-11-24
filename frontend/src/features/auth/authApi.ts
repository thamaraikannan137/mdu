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
