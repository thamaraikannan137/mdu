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
