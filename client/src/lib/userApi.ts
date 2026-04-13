import { apiUrl } from './api'
import { isValidEmail } from './validation'

/** Matches `createUser` in `server/src/controllers/userController.js` */
export type RegisterUserPayload = {
  email: string
  name: string
  password: string
  user_type?: 'customer' | 'admin'
  address?: string
}

export type RegisterUserResponse = {
  _id: string
  email: string
  name: string
  user_type: string
  address?: string
  createdAt: string
  updatedAt: string
}

/**
 * POST `/api/users` — creates a user in MongoDB (password hashed on server).
 * Dev: Vite proxies `/api` → `http://localhost:5000`.
 */
export async function registerUser(
  payload: RegisterUserPayload,
): Promise<RegisterUserResponse> {
  if (!isValidEmail(payload.email)) {
    throw new Error('올바른 이메일 형식이 아닙니다.')
  }

  const res = await fetch(apiUrl('/api/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      name: payload.name,
      password: payload.password,
      user_type: payload.user_type ?? 'customer',
      ...(payload.address !== undefined && { address: payload.address }),
    }),
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
        : '가입에 실패했습니다.'
    throw new Error(message)
  }

  return data as RegisterUserResponse
}
