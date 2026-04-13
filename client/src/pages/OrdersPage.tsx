import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAuthSessionValid } from '@/lib/authApi'
import { listOrders, type OrderRecord } from '@/lib/orderApi'
import './OrdersPage.css'

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

type OrdersTab = 'all' | 'processing' | 'shipping' | 'done'

function tabLabel(tab: OrdersTab): string {
  switch (tab) {
    case 'all':
      return '전체'
    case 'processing':
      return '처리중'
    case 'shipping':
      return '배송중'
    case 'done':
      return '완료'
  }
}

function matchesTab(o: OrderRecord, tab: OrdersTab): boolean {
  if (tab === 'all') return true
  const s = o.status
  if (tab === 'processing') return ['paid', 'preparing', 'pending_payment'].includes(s)
  if (tab === 'shipping') return s === 'shipped'
  if (tab === 'done') return ['delivered', 'refunded', 'cancelled'].includes(s)
  return true
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [tab, setTab] = useState<OrdersTab>('all')

  const load = useCallback(async () => {
    if (!isAuthSessionValid()) {
      navigate('/login', { state: { from: '/orders' } })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await listOrders()
      setOrders(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '주문 목록을 불러오지 못했습니다.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  const visibleOrders = useMemo(
    () => orders.filter((o) => matchesTab(o, tab)),
    [orders, tab],
  )
  const counts = useMemo(() => {
    const all = orders.length
    const processing = orders.filter((o) => matchesTab(o, 'processing')).length
    const shipping = orders.filter((o) => matchesTab(o, 'shipping')).length
    const done = orders.filter((o) => matchesTab(o, 'done')).length
    return { all, processing, shipping, done }
  }, [orders])

  const empty = useMemo(
    () => !loading && !error && visibleOrders.length === 0,
    [error, loading, visibleOrders.length],
  )

  return (
    <main className="orders">
      <header className="orders__header">
        <h1 className="orders__title">내 주문</h1>
        <p className="orders__subtitle">최근 주문 내역을 확인할 수 있습니다.</p>
      </header>

      {!loading && !error && orders.length > 0 && (
        <div className="orders__tabs" role="tablist" aria-label="주문 상태 필터">
          {(['all', 'processing', 'shipping', 'done'] as const).map((t) => {
            const c =
              t === 'all'
                ? counts.all
                : t === 'processing'
                  ? counts.processing
                  : t === 'shipping'
                    ? counts.shipping
                    : counts.done
            return (
              <button
                key={t}
                type="button"
                className="orders__tab"
                role="tab"
                aria-selected={tab === t}
                data-active={tab === t ? 'true' : undefined}
                onClick={() => setTab(t)}
              >
                <span className="orders__tab-label">{tabLabel(t)}</span>
                <span className="orders__tab-count">{c}</span>
              </button>
            )
          })}
        </div>
      )}

      {loading && <p className="orders__hint">불러오는 중…</p>}
      {error && (
        <div className="orders__error" role="alert">
          <p className="orders__error-msg">{error}</p>
          <button type="button" className="orders__btn orders__btn--ghost" onClick={() => void load()}>
            다시 시도
          </button>
        </div>
      )}

      {empty && (
        <div className="orders__empty">
          <p className="orders__hint">
            {tab === 'all' ? '아직 주문이 없습니다.' : `${tabLabel(tab)} 주문이 없습니다.`}
          </p>
          <Link to="/" className="orders__btn">
            쇼핑하러 가기
          </Link>
        </div>
      )}

      {!loading && !error && visibleOrders.length > 0 && (
        <ul className="orders__list" aria-label="주문 목록">
          {visibleOrders.map((o) => (
            <li key={o._id} className="orders__row">
              <Link to={`/orders/${encodeURIComponent(o._id)}`} className="orders__row-link">
                <div className="orders__row-top">
                  <div className="orders__row-left">
                    <p className="orders__order-no">{o.orderNumber}</p>
                    <p className="orders__order-date">{fmtDate(o.createdAt)}</p>
                  </div>
                  <span className="orders__status" data-status={o.status}>
                    {statusLabel(o.status)}
                  </span>
                </div>
                <div className="orders__row-bottom">
                  <span className="orders__muted">
                    상품 {Array.isArray(o.items) ? o.items.length : 0}개
                  </span>
                  <span className="orders__total">{USD.format(Number(o.total ?? 0))}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

