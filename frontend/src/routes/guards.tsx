import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessToken } from '@/services/token'

type GuardProps = {
  children: ReactNode
}

export function RequireAuth({ children }: GuardProps) {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />
  }
  return children
}

export function GuestOnly({ children }: GuardProps) {
  if (getAccessToken()) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
