import type { ProductCategory } from '@/constants/productCategories'
import { apiUrl } from './api'
import { getAuthorizationHeader } from './authApi'

export type ProductPayload = {
  sku: string
  name: string
  price: number
  category: ProductCategory
  image: string
  description?: string
}

export type Product = ProductPayload & {
  _id: string
  createdAt: string
  updatedAt: string
}

function parseErrorBody(data: unknown, fallback: string): string {
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

/**
 * 상품 API — `POST`/`PATCH`/`DELETE`는 서버에서 JWT + admin 권한 필요.
 * `main.tsx`의 `BrowserRouter` 아래 페이지에서 저장된 로그인 토큰이 `Authorization`에 붙습니다.
 */
async function fetchProduct(
  path: string,
  options: {
    method?: string
    jsonBody?: unknown
    headers?: HeadersInit
  } = {},
): Promise<Response> {
  const { method = 'GET', jsonBody, headers: initHeaders } = options
  const headers = new Headers(initHeaders)
  if (jsonBody !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  const auth = getAuthorizationHeader()
  if (auth.Authorization) {
    headers.set('Authorization', auth.Authorization)
  }
  return fetch(apiUrl(path), {
    method,
    headers,
    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
  })
}

export async function listProducts(): Promise<Product[]> {
  const res = await fetchProduct('/api/products', { method: 'GET' })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseErrorBody(data, '상품 목록을 불러오지 못했습니다.'))
  }
  return data as Product[]
}

/** 메인 스토어 등 비로그인 — `Authorization` 없이 `GET /api/products`만 호출 */
export async function listPublicProducts(): Promise<Product[]> {
  const res = await fetch(apiUrl('/api/products'), { method: 'GET' })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseErrorBody(data, '상품 목록을 불러오지 못했습니다.'))
  }
  return data as Product[]
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetchProduct(`/api/products/${encodeURIComponent(id)}`, {
    method: 'GET',
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseErrorBody(data, '상품을 찾을 수 없습니다.'))
  }
  return data as Product
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const res = await fetchProduct('/api/products', {
    method: 'POST',
    jsonBody: payload,
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseErrorBody(data, '상품 등록에 실패했습니다.'))
  }
  return data as Product
}

export async function updateProduct(
  id: string,
  partial: Partial<ProductPayload>,
): Promise<Product> {
  const res = await fetchProduct(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    jsonBody: partial,
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseErrorBody(data, '상품 수정에 실패했습니다.'))
  }
  return data as Product
}

export async function deleteProduct(
  id: string,
): Promise<{ deleted: boolean; product: Product }> {
  const res = await fetchProduct(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  const data = await readJson(res)
  if (!res.ok) {
    throw new Error(parseErrorBody(data, '상품 삭제에 실패했습니다.'))
  }
  return data as { deleted: boolean; product: Product }
}
