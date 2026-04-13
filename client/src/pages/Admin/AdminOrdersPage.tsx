import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeader from '@/components/admin/AdminHeader'
import { listOrders, updateOrder, type OrderRecord } from '@/lib/orderApi'
import './AdminOrdersPage.css'

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
      return '주문확인'
    case 'paid':
      return '주문확인'
    case 'preparing':
      return '상품 준비 중'
    case 'shipping_started':
      return '배송 시작'
    case 'shipped':
      return '배송 중'
    case 'delivered':
      return '배송 완료'
    case 'cancelled':
      return '주문 취소'
    case 'refunded':
      return '환불'
    default:
      return status
  }
}

function badgeClass(status: string): string {
  if (status === 'delivered') return 'admin__badge admin__badge--delivered'
  if (status === 'shipped') return 'admin__badge admin__badge--shipped'
  if (status === 'shipping_started') return 'admin__badge admin__badge--shipped'
  if (status === 'preparing' || status === 'paid' || status === 'pending_payment')
    return 'admin__badge admin__badge--processing'
  return 'admin__badge admin__badge--pending'
}

type AdminOrdersTab =
  | 'all'
  | 'order_confirm'
  | 'preparing'
  | 'shipping_started'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

function tabLabel(t: AdminOrdersTab): string {
  switch (t) {
    case 'all':
      return '전체'
    case 'order_confirm':
      return '주문확인'
    case 'preparing':
      return '상품준비중'
    case 'shipping_started':
      return '배송시작'
    case 'shipped':
      return '배송중'
    case 'delivered':
      return '배송완료'
    case 'cancelled':
      return '주문취소'
  }
}

function matchesTab(o: OrderRecord, t: AdminOrdersTab): boolean {
  if (t === 'all') return true
  if (t === 'order_confirm') return ['pending_payment', 'paid'].includes(o.status)
  return o.status === t
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'pending_payment', label: '주문확인' },
  { value: 'paid', label: '주문확인(결제완료)' },
  { value: 'preparing', label: '상품준비중' },
  { value: 'shipping_started', label: '배송시작' },
  { value: 'shipped', label: '배송중' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '주문취소' },
]

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [tab, setTab] = useState<AdminOrdersTab>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await listOrders()
      setOrders(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setOrders([])
      setError(e instanceof Error ? e.message : '주문 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => orders.filter((o) => matchesTab(o, tab)), [orders, tab])
  const counts = useMemo(() => {
    return {
      all: orders.length,
      order_confirm: orders.filter((o) => matchesTab(o, 'order_confirm')).length,
      preparing: orders.filter((o) => matchesTab(o, 'preparing')).length,
      shipping_started: orders.filter((o) => matchesTab(o, 'shipping_started')).length,
      shipped: orders.filter((o) => matchesTab(o, 'shipped')).length,
      delivered: orders.filter((o) => matchesTab(o, 'delivered')).length,
      cancelled: orders.filter((o) => matchesTab(o, 'cancelled')).length,
    }
  }, [orders])

  const empty = useMemo(
    () => !loading && !error && visible.length === 0,
    [error, loading, visible.length],
  )

  async function handleChangeStatus(orderId: string, nextStatus: string) {
    setBusyId(orderId)
    setError(null)
    try {
      const updated = await updateOrder(orderId, { status: nextStatus })
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)))
    } catch (e) {
      setError(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminHeader
        heading={
          <div>
            <p className="admin-orders__title">주문 관리</p>
            <p className="admin-orders__subtitle">상태별로 주문을 확인하고 상태를 변경할 수 있습니다.</p>
          </div>
        }
        actionsBeforeSearch={
          <button type="button" className="admin__new-product-btn admin-orders__refresh" onClick={() => void load()}>
            새로고침
          </button>
        }
      />

      <div className="admin__content">
        {!loading && !error && orders.length > 0 && (
          <div className="admin-orders__tabs" role="tablist" aria-label="주문 상태 필터">
            {(
              [
                'all',
                'order_confirm',
                'preparing',
                'shipping_started',
                'shipped',
                'delivered',
                'cancelled',
              ] as const
            ).map((t) => (
              <button
                key={t}
                type="button"
                className="admin-orders__tab"
                role="tab"
                aria-selected={tab === t}
                data-active={tab === t ? 'true' : undefined}
                onClick={() => setTab(t)}
              >
                <span className="admin-orders__tab-label">{tabLabel(t)}</span>
                <span className="admin-orders__tab-count">{counts[t]}</span>
              </button>
            ))}
          </div>
        )}

        {loading && <p className="admin-orders__hint">불러오는 중…</p>}
        {error && (
          <div className="admin-orders__error" role="alert">
            <p className="admin-orders__error-msg">{error}</p>
            <button type="button" className="admin__new-product-btn admin-orders__refresh" onClick={() => void load()}>
              다시 시도
            </button>
          </div>
        )}

        {empty && <p className="admin-orders__hint">{tabLabel(tab)} 주문이 없습니다.</p>}

        {!loading && !error && visible.length > 0 && (
          <div className="admin__table-wrap">
            <div className="admin__table-head">
              <h2 className="admin__table-title">Orders</h2>
              <p className="admin__table-sub">
                {tabLabel(tab)} · {visible.length.toLocaleString()}건
              </p>
            </div>
            <table className="admin__table admin-orders__table">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>고객</th>
                  <th>상태</th>
                  <th>상품</th>
                  <th>총액</th>
                  <th>생성일</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <Link className="admin-orders__order-link" to={`/orders/${encodeURIComponent(o._id)}`}>
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <span className="admin__customer-name">{o.customerName ?? '—'}</span>
                      <span className="admin__customer-email">{o.customerEmail ?? ''}</span>
                    </td>
                    <td>
                      <div className="admin-orders__status-wrap">
                        <span className={badgeClass(o.status)}>{statusLabel(o.status)}</span>
                        <select
                          className="admin-orders__status-select"
                          value={o.status}
                          disabled={busyId === o._id}
                          onChange={(e) => void handleChangeStatus(o._id, e.target.value)}
                          aria-label="주문 상태 변경"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="admin-orders__items">
                      {Array.isArray(o.items) && o.items.length > 0 ? (
                        <>
                          <span className="admin-orders__item-main">
                            {o.items[0]?.name ?? '상품'}
                          </span>
                          {o.items.length > 1 && (
                            <span className="admin-orders__item-more">외 {o.items.length - 1}개</span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="admin__amount">{USD.format(Number(o.total ?? 0))}</td>
                    <td className="admin-orders__date">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

