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
