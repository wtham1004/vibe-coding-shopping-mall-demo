import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminHeader from '@/components/admin/AdminHeader'
import { listProducts, type Product } from '@/lib/productApi'
import './AdminPage.css'

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const ORDERS = [
  {
    id: '#ORD-7291',
    customer: 'Sarah Jenkins',
    email: 'sarah.j@email.com',
    product: 'Wool Coat — Black',
    status: 'delivered' as const,
    amount: '$450.00',
  },
  {
    id: '#ORD-7290',
    customer: 'Michael Chen',
    email: 'm.chen@email.com',
    product: 'Leather Tote',
    status: 'shipped' as const,
    amount: '$240.00',
  },
  {
    id: '#ORD-7289',
    customer: 'Emma Wilson',
    email: 'emma.w@email.com',
    product: 'Silk Dress — Cream',
    status: 'processing' as const,
    amount: '$120.00',
  },
  {
    id: '#ORD-7288',
    customer: 'James Rodriguez',
    email: 'j.rodriguez@email.com',
    product: 'Cashmere Knit',
    status: 'pending' as const,
    amount: '$195.00',
  },
]

function IconPackage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function statusClass(s: (typeof ORDERS)[0]['status']) {
  switch (s) {
    case 'delivered':
      return 'admin__badge admin__badge--delivered'
    case 'shipped':
      return 'admin__badge admin__badge--shipped'
    case 'processing':
      return 'admin__badge admin__badge--processing'
    default:
      return 'admin__badge admin__badge--pending'
  }
}

export default function AdminPage() {
  const [catalog, setCatalog] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await listProducts()
        if (!cancelled) setCatalog(data)
      } catch {
        if (!cancelled) setCatalog([])
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const topProducts = useMemo(() => {
    return [...catalog]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 4)
  }, [catalog])

  const maxTopPrice = useMemo(() => {
    if (topProducts.length === 0) return 1
    return Math.max(...topProducts.map((p) => p.price), 1)
  }, [topProducts])

  return (
    <>
      <AdminHeader
        heading={
          <p className="admin__greeting">
            Welcome back! Here&apos;s what&apos;s happening with your store.
          </p>
        }
        actionsBeforeSearch={
          <div className="admin__header-actions">
            <Link to="/admin/orders" className="admin__header-link-btn admin__header-link-btn--ghost">
              주문 관리
            </Link>
            <Link to="/admin/products/new" className="admin__new-product-btn">
              새상품 등록하기
            </Link>
          </div>
        }
      />

      <div className="admin__content">
        <div className="admin__stats">
          <div className="admin__stat">
            <div className="admin__stat-head">
              <span className="admin__stat-label">Total Revenue</span>
              <span className="admin__stat-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
            </div>
            <p className="admin__stat-value">$45,231.89</p>
            <p className="admin__stat-delta">+20.1% from last month</p>
          </div>
          <div className="admin__stat">
            <div className="admin__stat-head">
              <span className="admin__stat-label">Orders</span>
              <span className="admin__stat-icon" aria-hidden>
                <IconCart />
              </span>
            </div>
            <p className="admin__stat-value">2,350</p>
            <p className="admin__stat-delta">+15.2% from last month</p>
          </div>
          <div className="admin__stat">
            <div className="admin__stat-head">
              <span className="admin__stat-label">Customers</span>
              <span className="admin__stat-icon" aria-hidden>
                <IconUsers />
              </span>
            </div>
            <p className="admin__stat-value">12,234</p>
            <p className="admin__stat-delta">+10.5% from last month</p>
          </div>
          <div className="admin__stat">
            <div className="admin__stat-head">
              <span className="admin__stat-label">Products</span>
              <span className="admin__stat-icon" aria-hidden>
                <IconPackage />
              </span>
            </div>
            <p className="admin__stat-value">
              {catalogLoading ? '…' : catalog.length.toLocaleString()}
            </p>
            <p className="admin__stat-delta">From MongoDB catalog</p>
          </div>
        </div>

        <div className="admin__row2">
          <div className="admin__panel">
            <h2 className="admin__panel-title">Revenue Overview</h2>
            <div className="admin__chart-wrap">
              <svg
                className="admin__chart-svg"
                viewBox="0 0 800 200"
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,160 C80,140 120,180 200,120 C280,60 320,100 400,80 C480,60 520,40 600,70 C680,100 720,50 800,30 L800,200 L0,200 Z"
                  fill="url(#revArea)"
                />
                <path
                  d="M0,160 C80,140 120,180 200,120 C280,60 320,100 400,80 C480,60 520,40 600,70 C680,100 720,50 800,30"
                  fill="none"
                  stroke="url(#revLine)"
                  strokeWidth="2.5"
                />
              </svg>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.35rem',
                  fontSize: '0.65rem',
                  color: '#6b7280',
                }}
              >
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(
                  (m) => (
                    <span key={m}>{m}</span>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="admin__panel">
            <h2 className="admin__panel-title">Top Products</h2>
            <div className="admin__top-products">
              {catalogLoading ? (
                <p className="admin__catalog-hint">상품을 불러오는 중…</p>
              ) : topProducts.length === 0 ? (
                <p className="admin__catalog-hint">
                  등록된 상품이 없습니다.{' '}
                  <Link to="/admin/products/new">상품 등록</Link>
                </p>
              ) : (
                topProducts.map((p) => (
                  <div key={p._id} className="admin__product-row">
                    <div>
                      <p className="admin__product-name">{p.name}</p>
                    </div>
                    <p className="admin__product-meta">
                      {USD.format(p.price)} · {p.category}
                    </p>
                    <div className="admin__bar-track">
                      <div
                        className="admin__bar-fill"
                        style={{
                          width: `${Math.round((p.price / maxTopPrice) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="admin__table-wrap">
          <div className="admin__table-head">
            <h2 className="admin__table-title">Recent Orders</h2>
            <p className="admin__table-sub">Latest orders from your customers</p>
          </div>
          <table className="admin__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>
                    <span className="admin__customer-name">{row.customer}</span>
                    <span className="admin__customer-email">{row.email}</span>
                  </td>
                  <td>{row.product}</td>
                  <td>
                    <span className={statusClass(row.status)}>{row.status}</span>
                  </td>
                  <td className="admin__amount">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

