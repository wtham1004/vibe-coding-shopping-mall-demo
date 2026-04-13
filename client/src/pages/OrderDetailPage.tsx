import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { isAuthSessionValid } from '@/lib/authApi'
import { getOrderById, type OrderRecord } from '@/lib/orderApi'
import './OrderDetailPage.css'

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function fmtDate(d?: string): string {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending_payment':
      return '결제 대기'
    case 'paid':
      return '결제 완료'
    case 'preparing':
      return '상품 준비 중'
    case 'shipped':
      return '배송 중'
    case 'delivered':
      return '배송 완료'
    case 'cancelled':
      return '취소'
    case 'refunded':
      return '환불'
    default:
      return status
  }
}

export default function OrderDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderRecord | null>(null)

  const load = useCallback(async () => {
    if (!isAuthSessionValid()) {
      navigate('/login', { state: { from: `/orders/${id ?? ''}` } })
      return
    }
    if (!id) {
      setError('유효한 주문 id가 필요합니다.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const o = await getOrderById(id)
      setOrder(o)
    } catch (e) {
      setOrder(null)
      setError(e instanceof Error ? e.message : '주문을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    void load()
  }, [load])

  const lines = order?.items ?? []
  const totals = useMemo(() => {
    if (!order) return null
    return {
      subtotal: Number(order.subtotal ?? 0),
      shippingFee: Number(order.shippingFee ?? 0),
      discountTotal: Number(order.discountTotal ?? 0),
      tax: Number(order.tax ?? 0),
      total: Number(order.total ?? 0),
    }
  }, [order])

  return (
    <main className="order-detail">
      <header className="order-detail__header">
        <Link to="/orders" className="order-detail__back">
          ← 내 주문
        </Link>
        <h1 className="order-detail__title">주문 상세</h1>
        <p className="order-detail__subtitle">주문 정보를 확인하세요.</p>
      </header>

      {loading && <p className="order-detail__hint">불러오는 중…</p>}
      {error && (
        <div className="order-detail__error" role="alert">
          <p className="order-detail__error-msg">{error}</p>
          <button type="button" className="order-detail__btn" onClick={() => void load()}>
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && order && (
        <section className="order-detail__card">
          <div className="order-detail__top">
            <div>
              <p className="order-detail__no">{order.orderNumber}</p>
              <p className="order-detail__date">{fmtDate(order.createdAt)}</p>
            </div>
            <span className="order-detail__status">{statusLabel(order.status)}</span>
          </div>

          <div className="order-detail__section">
            <h2 className="order-detail__h2">주문 상품</h2>
            <ul className="order-detail__lines">
              {lines.map((it) => {
                const opts = [it.color, it.size].filter(Boolean).join(' / ')
                return (
                  <li key={it._id ?? `${it.sku}-${it.name}`} className="order-detail__line">
                    <div className="order-detail__imgwrap">
                      {it.image ? (
                        <img className="order-detail__img" alt="" src={String(it.image)} />
                      ) : (
                        <div className="order-detail__img order-detail__img--ph" />
                      )}
                    </div>
                    <div className="order-detail__meta">
                      <p className="order-detail__name">{it.name}</p>
                      <p className="order-detail__sub">
                        {it.sku}
                        {opts ? ` · ${opts}` : ''} · 수량 {it.quantity}
                      </p>
                    </div>
                    <div className="order-detail__price">
                      {USD.format(Number(it.lineTotal ?? 0))}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {totals && (
            <div className="order-detail__section">
              <h2 className="order-detail__h2">금액</h2>
              <dl className="order-detail__totals">
                <div className="order-detail__row">
                  <dt>소계</dt>
                  <dd>{USD.format(totals.subtotal)}</dd>
                </div>
                <div className="order-detail__row">
                  <dt>배송</dt>
                  <dd>{USD.format(totals.shippingFee)}</dd>
                </div>
                <div className="order-detail__row">
                  <dt>세금</dt>
                  <dd>{USD.format(totals.tax)}</dd>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="order-detail__row order-detail__row--discount">
                    <dt>할인</dt>
                    <dd>−{USD.format(totals.discountTotal)}</dd>
                  </div>
                )}
                <div className="order-detail__row order-detail__row--final">
                  <dt>총액</dt>
                  <dd>{USD.format(totals.total)}</dd>
                </div>
              </dl>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

