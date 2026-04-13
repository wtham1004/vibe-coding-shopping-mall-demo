import { apiUrl } from './api'
import { getAuthorizationHeader } from './authApi'
import type { Product } from './productApi'

export const NOIR_CART_UPDATED_EVENT = 'noir-cart-updated'

export function notifyCartUpdated() {
  window.dispatchEvent(new Event(NOIR_CART_UPDATED_EVENT))
}

export type CartItem = {
  _id: string
  product: Product
  quantity: number
  size?: string
  color?: string
}

export type Cart = {
  _id: string
  user: string
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

function parseError(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error
  }
  return fallback
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export async function getCart(): Promise<Cart> {
  const res = await fetch(apiUrl('/api/cart'), {
    headers: { ...getAuthorizationHeader() },
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseError(data, '장바구니를 불러오지 못했습니다.'))
  }
  return data as Cart
}

export async function addCartItem(body: {
  product: string
  quantity?: number
  size?: string
  color?: string
}): Promise<Cart> {
  const res = await fetch(apiUrl('/api/cart/items'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify(body),
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseError(data, '장바구니에 담지 못했습니다.'))
  }
  return data as Cart
}

export async function updateCartItem(
  itemId: string,
  body: { quantity?: number; size?: string; color?: string },
): Promise<Cart> {
  const res = await fetch(apiUrl(`/api/cart/items/${encodeURIComponent(itemId)}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify(body),
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseError(data, '수정에 실패했습니다.'))
  }
  return data as Cart
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const res = await fetch(apiUrl(`/api/cart/items/${encodeURIComponent(itemId)}`), {
    method: 'DELETE',
    headers: { ...getAuthorizationHeader() },
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseError(data, '삭제에 실패했습니다.'))
  }
  return data as Cart
}

export function totalQuantityInCart(cart: Cart): number {
  return cart.items.reduce((sum, row) => sum + row.quantity, 0)
}
