import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import './OrderSuccessPage.css'
import type { OrderItemRecord, OrderRecord } from '@/lib/orderApi'

type LocationState = {
  orderNumber?: unknown
  orderId?: unknown
  order?: unknown
}

type LastOrderSnapshot = Pick<
  OrderRecord,
  | '_id'
  | 'orderNumber'
  | 'status'
  | 'currency'
  | 'subtotal'
  | 'shippingFee'
  | 'discountTotal'
  | 'tax'
  | 'total'
  | 'items'
  | 'createdAt'
>

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function safeParseLastOrder(raw: string | null): LastOrderSnapshot | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return null
    const o = v as Partial<LastOrderSnapshot>
    if (typeof o._id !== 'string' || typeof o.orderNumber !== 'string') return null
    if (!Array.isArray(o.items)) return null
    return o as LastOrderSnapshot
  } catch {
    return null
  }
}

function lineTitle(it: OrderItemRecord): string {
  const opts = [it.color, it.size].filter(Boolean).join(' / ')
  return opts ? `${it.name} (${opts})` : it.name
}

export default function OrderSuccessPage() {
  const location = useLocation()

  const snapshot = useMemo((): LastOrderSnapshot | null => {
    const s =
      typeof location.state === 'object' && location.state !== null
        ? (location.state as LocationState)
        : null
    if (s?.order && typeof s.order === 'object' && s.order !== null) {
      const o = s.order as Partial<LastOrderSnapshot>
      if (typeof o._id === 'string' && typeof o.orderNumber === 'string' && Array.isArray(o.items)) {
        return o as LastOrderSnapshot
      }
    }
    try {
      const fromSession = safeParseLastOrder(sessionStorage.getItem('NOIR_LAST_ORDER'))
      if (fromSession) return fromSession
    } catch {
      /* empty */
    }
    return null
  }, [location.state])

  const orderNumber = snapshot?.orderNumber ?? null
  const orderId = snapshot?._id ?? null
  const items = snapshot?.items ?? []

  return (
    <main className="order-success">
      <section className="order-success__card" aria-label="주문 완료">
        <div className="order-success__badge" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="order-success__eyebrow">ORDER CONFIRMED</p>
        <h1 className="order-success__title">주문이 완료되었습니다</h1>
        <p className="order-success__desc">
          감사합니다. 주문이 정상적으로 접수되었습니다.
        </p>

        <div className="order-success__meta" role="status" aria-live="polite">
          <div className="order-success__meta-row">
            <span className="order-success__meta-k">주문번호</span>
            <span className="order-success__meta-v">
              {orderNumber ? (
                <code className="order-success__code">{orderNumber}</code>
              ) : (
                <span className="order-success__meta-muted">표시할 주문번호가 없습니다</span>
              )}
            </span>
          </div>
          <div className="order-success__meta-row">
            <span className="order-success__meta-k">안내</span>
            <span className="order-success__meta-v order-success__meta-muted">
              주문 내역은 “내 주문”에서 확인할 수 있습니다.
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <div className="order-success__items" aria-label="주문 상품">
            <h2 className="order-success__items-title">주문 상품</h2>
            <ul className="order-success__items-list">
              {items.slice(0, 6).map((it) => (
                <li key={it._id ?? `${it.sku}-${it.name}`} className="order-success__item">
                  <div className="order-success__item-imgwrap">
                    {it.image ? (
                      <img className="order-success__item-img" alt="" src={String(it.image)} />
                    ) : (
                      <div className="order-success__item-img order-success__item-img--ph" />
                    )}
                  </div>
                  <div className="order-success__item-meta">
                    <p className="order-success__item-name">{lineTitle(it)}</p>
                    <p className="order-success__item-sub">
                      {it.sku} · 수량 {it.quantity}
                    </p>
                  </div>
                  <div className="order-success__item-price">
                    {USD.format(Number(it.lineTotal ?? 0))}
                  </div>
                </li>
              ))}
            </ul>
            {items.length > 6 && (
              <p className="order-success__more">
                외 {items.length - 6}개 상품이 더 있습니다.
              </p>
            )}
          </div>
        )}

        <div className="order-success__actions">
          {orderId ? (
            <Link to={`/orders/${encodeURIComponent(orderId)}`} className="order-success__primary">
              주문 상세 보기(내 주문)
            </Link>
          ) : (
            <Link to="/orders" className="order-success__primary">
              내 주문 보기
            </Link>
          )}
          <Link to="/" className="order-success__secondary">
            홈으로 가기
          </Link>
        </div>

        <p className="order-success__footnote">
          문제가 있나요? 다시 시도하기 전에 장바구니를 확인해 주세요.
        </p>
      </section>
    </main>
  )
}

