import { apiUrl } from './api'
import { isValidEmail } from './validation'

export type LoginUser = {
  _id: string
  email: string
  name: string
  user_type: string
  address?: string
  createdAt: string
  updatedAt: string
}

export type LoginResponse = {
  token: string
  tokenType: string
  expiresIn: string
  expiresAt: string | null
  user: LoginUser
}

const AUTH_STORAGE_KEY = 'noir_auth'

export function getStoredAuth(): LoginResponse | null {
  try {
    const fromSession = sessionStorage.getItem(AUTH_STORAGE_KEY)
    const fromLocal = localStorage.getItem(AUTH_STORAGE_KEY)
    const raw = fromSession ?? fromLocal
    if (!raw) return null
    return JSON.parse(raw) as LoginResponse
  } catch {
    return null
  }
}

/** `fetch`용 — 저장된 JWT가 있으면 `Authorization: Bearer …` 헤더 */
export function getAuthorizationHeader(): Record<string, string> {
  const token = getStoredAuth()?.token
  if (!token || typeof token !== 'string') return {}
  return { Authorization: `Bearer ${token}` }
}

export function clearStoredAuth() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function saveAuth(data: LoginResponse, remember: boolean) {
  clearStoredAuth()
  const payload = JSON.stringify(data)
  if (remember) {
    localStorage.setItem(AUTH_STORAGE_KEY, payload)
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEY, payload)
  }
}

/** JWT payload 디코드 (서명 검증 없음 — 클라이언트 만료 확인용). */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64
    return JSON.parse(atob(padded)) as { exp?: number }
  } catch {
    return null
  }
}

/** 저장된 토큰 + 유저가 있고, 토큰이 만료되지 않았으면 true */
export function isAuthSessionValid(): boolean {
  const auth = getStoredAuth()
  if (!auth?.token || typeof auth.token !== 'string') return false
  if (!auth.user || typeof auth.user._id !== 'string') return false
  const payload = decodeJwtPayload(auth.token)
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp * 1000 > Date.now()
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  if (!isValidEmail(email)) {
    throw new Error('올바른 이메일 형식이 아닙니다.')
  }

  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  })

  let data: unknown = {}
  try {
    data = await res.json()
  } catch {
    /* empty */
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : '로그인에 실패했습니다.'
    throw new Error(message)
  }

  return data as LoginResponse
}
