import { apiUrl } from './api'
import { getAuthorizationHeader } from './authApi'

export type ShippingAddressPayload = {
  recipientName: string
  phone?: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export type CreateOrderPayload = {
  shippingAddress: ShippingAddressPayload
  billingAddress?: ShippingAddressPayload
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  note?: string
  shippingFee?: number
  discountTotal?: number
  tax?: number
  currency?: string
  markPaid?: boolean
  paymentMethod?: string
  paymentProvider?: string
  providerPaymentId?: string
}

export type OrderItemRecord = {
  _id: string
  sku: string
  name: string
  image?: string
  unitPrice: number
  quantity: number
  size?: string
  color?: string
  lineTotal: number
  [key: string]: unknown
}

export type OrderRecord = {
  _id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  items: OrderItemRecord[]
  currency?: string
  shippingFee?: number
  discountTotal?: number
  tax?: number
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
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

export async function createOrder(payload: CreateOrderPayload): Promise<OrderRecord> {
  const res = await fetch(apiUrl('/api/orders'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify(payload),
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseError(data, '주문에 실패했습니다.'))
  }
  return data as OrderRecord
}

export async function listOrders(params?: { status?: string }): Promise<OrderRecord[]> {
  const qs =
    params?.status && params.status.trim()
      ? `?status=${encodeURIComponent(params.status.trim())}`
      : ''
  const res = await fetch(apiUrl(`/api/orders${qs}`), {
    headers: {
      ...getAuthorizationHeader(),
    },
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseError(data, '주문 목록을 불러오지 못했습니다.'))
  }
  return data as OrderRecord[]
}

export async function getOrderById(id: string): Promise<OrderRecord> {
  const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}`), {
    headers: {
      ...getAuthorizationHeader(),
    },
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseError(data, '주문을 불러오지 못했습니다.'))
  }
  return data as OrderRecord
}

export async function updateOrder(
  id: string,
  payload: { status?: string; trackingNumber?: string | null; carrier?: string | null; shippedAt?: string | null },
): Promise<OrderRecord> {
  const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify(payload),
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseError(data, '주문 업데이트에 실패했습니다.'))
  }
  return data as OrderRecord
}
